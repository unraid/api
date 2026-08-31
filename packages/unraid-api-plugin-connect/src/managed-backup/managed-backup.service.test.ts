import { ConfigService } from '@nestjs/config';
import { access, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectConfigPersister } from '../config/config.persistence.js';
import { cronMatches, ManagedBackupService, recoveryPhraseIsUsable } from './managed-backup.service.js';
import { ManagedBackupStore } from './managed-backup.store.js';

const execaMock = vi.hoisted(() => vi.fn());
vi.mock('execa', () => ({ execa: execaMock }));

describe('managed backup service', () => {
    let directory: string;
    let backupDir: string;
    let store: ManagedBackupStore;
    let service: ManagedBackupService;
    let requests: Array<{ path: string; method: string; body: unknown }>;
    let resticRepositoryId: string;
    let migrationMarker: string;

    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'managed-backup-service-'));
        backupDir = join(directory, 'backup');
        requests = [];
        resticRepositoryId = 'restic-repository-1';
        migrationMarker = join(directory, 'migration-pending');
        const config = new ConfigService({
            CONNECT_MANAGED_BACKUP_CONFIG_DIR: backupDir,
            CONNECT_MANAGED_BACKUP_SECRET_KEY_PATH: join(directory, 'secret_key_base'),
            CONNECT_CONTROL_PLANE_URL: 'https://connect.example',
            CONNECT_RESTIC_PATH: '/usr/local/bin/restic',
            CONNECT_MANAGED_BACKUP_MIGRATION_MARKER: migrationMarker,
            CONNECT_LEGACY_FLASH_BACKUP_SERVICE: '/test/rc.flash_backup',
        });
        store = new ManagedBackupStore(config);
        const connect = {
            getConfig: () => ({ apikey: 'server-key' }),
        } as ConnectConfigPersister;
        service = new ManagedBackupService(config, connect, store);
        execaMock.mockImplementation(async (_path, args: string[]) => ({
            stdout: args[0] === 'cat' ? JSON.stringify({ id: resticRepositoryId, version: 2 }) : '',
        }));
        vi.stubGlobal(
            'fetch',
            vi.fn(async (input: URL | RequestInfo, init?: RequestInit) => {
                const url = new URL(input instanceof URL ? input.href : input.toString());
                requests.push({
                    path: url.pathname,
                    method: init?.method ?? 'GET',
                    body: init?.body ? JSON.parse(init.body.toString()) : null,
                });
                if (url.pathname === '/backup/v1/provision') {
                    return Response.json({
                        schemaVersion: 1,
                        repositoryId: 'repository-1',
                        repositoryUrl: 'https://connect.example/backup/v1/repository/server-hash/',
                        username: 'transport-user',
                        password: 'transport-secret',
                        generation: 1,
                        quotaBytes: 10_000_000_000,
                    });
                }
                if (url.pathname === '/backup/v1/provision/confirm') {
                    return Response.json({ ok: true });
                }
                if (url.pathname === '/backup/v1/usage') {
                    return Response.json({
                        schemaVersion: 1,
                        dnshash: 'server-hash',
                        tierId: 'connect-included',
                        quotaBytes: 10_000_000_000,
                        usedBytes: 100,
                        remainingBytes: 9_999_999_900,
                        objectCount: 2,
                        updatedAt: new Date().toISOString(),
                    });
                }
                return Response.json({}, { status: 404 });
            })
        );
    });

    afterEach(async () => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
        await rm(directory, { recursive: true, force: true });
    });

    it('sets up the Core job without starting the first backup or persisting the phrase', async () => {
        const phrase = 'abcde-fghij-klmno-pqrst-uvwxy-z2345-6789a';
        const result = await service.setup(phrase);
        expect(result).toMatchObject({ repositoryId: 'repository-1', targetCreated: true });
        expect(requests.map((request) => request.path)).toEqual([
            '/backup/v1/provision',
            '/backup/v1/provision/confirm',
        ]);
        expect(execaMock.mock.calls.map((call) => call[1][0])).toEqual(['cat', 'key', 'cat']);
        expect(execaMock.mock.calls.some((call) => call[1].includes('backup'))).toBe(false);

        const contents = await readTree(backupDir);
        expect(contents).not.toContain(phrase);
        expect(contents).not.toContain('transport-secret');
        expect(await store.loadState()).toMatchObject({
            setup_complete: true,
            initial_job_created: true,
            repository_id: 'repository-1',
            restic_repository_id: 'restic-repository-1',
        });
    });

    it('rejects unusable phrases before contacting Connect or Restic', async () => {
        await expect(service.setup('')).rejects.toThrow();
        expect(requests).toEqual([]);
        expect(execaMock).not.toHaveBeenCalled();
    });

    it('retires the legacy backup only after managed setup succeeds', async () => {
        await writeFile(migrationMarker, '');
        expect((await service.status()).legacyMigrationPending).toBe(true);

        await service.reconcileAfterStartup();
        expect(execaMock).not.toHaveBeenCalledWith('/test/rc.flash_backup', ['retire']);
        expect((await service.status()).legacyMigrationPending).toBe(true);

        await service.setup('migration phrase');

        expect(execaMock).toHaveBeenCalledWith('/test/rc.flash_backup', ['retire']);
        await expect(access(migrationMarker)).rejects.toThrow();
        expect((await service.status()).legacyMigrationPending).toBe(false);
    });

    it('adds a replacement key without removing the previous Restic key', async () => {
        const first = 'apple-bravo-cabin-delta-ember-fable-grove-harbor';
        const replacement = 'iris juniper kestrel lantern maple nimbus';
        await service.setup(first);
        execaMock.mockClear();

        await service.setup(replacement);

        const keyCalls = execaMock.mock.calls.filter((call) => call[1][0] === 'key');
        expect(keyCalls).toHaveLength(1);
        expect(keyCalls[0][1][1]).toBe('add');
        expect(execaMock.mock.calls.some((call) => call[1][1] === 'remove')).toBe(false);
        const contents = await readTree(backupDir);
        expect(contents).not.toContain(first);
        expect(contents).not.toContain(replacement);
    });

    it('adds the phrase when the provider id points at a different Restic repository', async () => {
        const phrase = 'short';
        await service.setup(phrase);
        execaMock.mockClear();
        resticRepositoryId = 'restic-repository-2';

        await service.setup(phrase);

        expect(execaMock.mock.calls.filter((call) => call[1][0] === 'key')).toHaveLength(1);
        expect(await store.loadState()).toMatchObject({
            repository_id: 'repository-1',
            restic_repository_id: 'restic-repository-2',
        });
    });

    it('executes the same job with Core job tags and job-scoped retention', async () => {
        await service.setup('abcde-fghij-klmno-pqrst-uvwxy-z2345-6789a');
        execaMock.mockClear();
        expect(service.startBackup()).toEqual({ started: true });
        await vi.waitFor(async () => {
            expect((await store.loadInitialJob())?.last_run_status).toBe('success');
        });
        const backup = execaMock.mock.calls.find((call) => call[1][0] === 'backup');
        const forget = execaMock.mock.calls.find((call) => call[1][0] === 'forget');
        expect(backup?.[1]).toContain('job:f3a9d870-146c-4f9e-b078-5bb0d9f20d0c');
        expect(backup?.[1]).toContain('source:flash');
        expect(backup?.[1]).toContain('/boot');
        expect(forget?.[1]).toContain('job:f3a9d870-146c-4f9e-b078-5bb0d9f20d0c');
        expect(forget?.[1]).toContain('--prune');
    });
});

describe('recoveryPhraseIsUsable', () => {
    it('accepts generated, short, and repeated custom phrases', () => {
        expect(recoveryPhraseIsUsable('abcde-fghij-klmno-pqrst-uvwxy-z2345-6789a')).toBe(true);
        expect(recoveryPhraseIsUsable('short')).toBe(true);
        expect(recoveryPhraseIsUsable('Ab1!'.repeat(8))).toBe(true);
    });

    it('rejects empty, control-character, and silently trimmed phrases', () => {
        expect(recoveryPhraseIsUsable('')).toBe(false);
        expect(recoveryPhraseIsUsable('phrase\n')).toBe(false);
        expect(recoveryPhraseIsUsable(` ${'apple-bravo-cabin-delta-ember-fable'}`)).toBe(false);
    });
});

describe('cronMatches', () => {
    it('supports normal five-field schedules and cron day semantics', () => {
        const mondayAtThree = new Date(2026, 7, 31, 3, 0);
        expect(cronMatches('0 3 * * *', mondayAtThree)).toBe(true);
        expect(cronMatches('*/15 2-4 * * 1-5', mondayAtThree)).toBe(true);
        expect(cronMatches('1 3 * * *', mondayAtThree)).toBe(false);
        expect(cronMatches('0 3 1 * 2', mondayAtThree)).toBe(false);
        expect(cronMatches('invalid', mondayAtThree)).toBe(false);
    });
});

async function readTree(path: string): Promise<string> {
    let combined = '';
    for (const entry of await readdir(path, { withFileTypes: true })) {
        const child = join(path, entry.name);
        combined += entry.isDirectory() ? await readTree(child) : await readFile(child, 'utf8');
    }
    return combined;
}
