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
    let migrationCompleteMarker: string;
    let resticKeys: Array<{ id: string; user: string; current: boolean }>;
    let resticKeySequence: number;
    let legacyRetirementFailures: number;
    let recoveryKeyRemovalFailures: number;
    let recoveryPhrases: Map<string, string>;

    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'managed-backup-service-'));
        backupDir = join(directory, 'backup');
        requests = [];
        resticRepositoryId = 'restic-repository-1';
        resticKeys = [{ id: 'machine-key', user: 'root', current: true }];
        resticKeySequence = 0;
        legacyRetirementFailures = 0;
        recoveryKeyRemovalFailures = 0;
        recoveryPhrases = new Map();
        migrationMarker = join(directory, 'migration-pending');
        migrationCompleteMarker = join(directory, 'migration-complete');
        const config = new ConfigService({
            CONNECT_MANAGED_BACKUP_CONFIG_DIR: backupDir,
            CONNECT_MANAGED_BACKUP_SECRET_KEY_PATH: join(directory, 'secret_key_base'),
            CONNECT_CONTROL_PLANE_URL: 'https://connect.example',
            CONNECT_RESTIC_PATH: '/usr/local/bin/restic',
            CONNECT_MANAGED_BACKUP_MIGRATION_MARKER: migrationMarker,
            CONNECT_MANAGED_BACKUP_MIGRATION_COMPLETE_MARKER: migrationCompleteMarker,
            CONNECT_LEGACY_FLASH_BACKUP_SERVICE: '/test/rc.flash_backup',
        });
        store = new ManagedBackupStore(config);
        const connect = {
            getConfig: () => ({ apikey: 'server-key' }),
        } as ConnectConfigPersister;
        service = new ManagedBackupService(config, connect, store);
        execaMock.mockImplementation(
            async (_path, args: string[], options?: { env?: Record<string, string> }) => {
                if (_path === '/test/rc.flash_backup' && legacyRetirementFailures > 0) {
                    legacyRetirementFailures -= 1;
                    throw new Error('retirement failed');
                }
                if (args[0] === 'cat') {
                    const passwordPath = options?.env?.RESTIC_PASSWORD_FILE;
                    if (passwordPath?.includes('/recovery-')) {
                        const phrase = await readFile(passwordPath, 'utf8');
                        if (![...recoveryPhrases.values()].includes(phrase)) {
                            throw new Error('wrong password');
                        }
                    }
                    return { stdout: JSON.stringify({ id: resticRepositoryId, version: 2 }) };
                }
                if (args[0] === 'key' && args[1] === 'list') {
                    const passwordPath = options?.env?.RESTIC_PASSWORD_FILE;
                    if (passwordPath?.includes('/recovery-')) {
                        const phrase = await readFile(passwordPath, 'utf8');
                        const currentId = [...recoveryPhrases.entries()].find(
                            ([, candidate]) => candidate === phrase
                        )?.[0];
                        if (!currentId) throw new Error('wrong password');
                        return {
                            stdout: JSON.stringify(
                                resticKeys.map((key) => ({
                                    ...key,
                                    current: key.id === currentId,
                                }))
                            ),
                        };
                    }
                    return { stdout: JSON.stringify(resticKeys) };
                }
                if (args[0] === 'key' && args[1] === 'add') {
                    const userIndex = args.indexOf('--user');
                    resticKeySequence += 1;
                    const passwordFileIndex = args.indexOf('--new-password-file');
                    const keyId = `recovery-key-${resticKeySequence}`;
                    resticKeys.push({
                        id: keyId,
                        user: userIndex >= 0 ? args[userIndex + 1] : '',
                        current: false,
                    });
                    recoveryPhrases.set(keyId, await readFile(args[passwordFileIndex + 1], 'utf8'));
                }
                if (args[0] === 'key' && args[1] === 'remove') {
                    if (recoveryKeyRemovalFailures > 0) {
                        recoveryKeyRemovalFailures -= 1;
                        throw new Error('key removal failed');
                    }
                    resticKeys = resticKeys.filter((key) => key.id !== args[2]);
                    recoveryPhrases.delete(args[2]);
                }
                return { stdout: '' };
            }
        );
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
                if (url.pathname === '/backup/v1/provision/finalize') {
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
            '/backup/v1/provision/finalize',
        ]);
        expect(requests[1].body).toEqual({
            repositoryId: 'repository-1',
            username: 'transport-user',
            generation: 1,
        });
        expect(requests[2].body).toEqual(requests[1].body);
        expect(execaMock.mock.calls.some((call) => call[1][0] === 'key')).toBe(true);
        expect(execaMock.mock.calls.some((call) => call[1].includes('backup'))).toBe(false);

        const contents = await readTree(backupDir);
        expect(contents).not.toContain(phrase);
        expect(contents).not.toContain('transport-secret');
        expect(await store.loadState()).toMatchObject({
            setup_complete: true,
            initial_job_created: true,
            target_id: '8ca41aac-f15c-4eca-a1bd-5d55bf80322c',
            target_name: 'Unraid Connect Backup Storage',
            repository_id: 'repository-1',
            restic_repository_id: 'restic-repository-1',
            recovery_key_id: 'recovery-key-1',
        });
        expect(contents).not.toContain('recovery_key_fingerprint');
        expect(await store.isCoreReady()).toBe(true);
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
        await expect(access(migrationCompleteMarker)).rejects.toThrow();

        await service.setup('migration phrase');

        expect(execaMock).toHaveBeenCalledWith('/test/rc.flash_backup', ['retire']);
        await expect(access(migrationMarker)).rejects.toThrow();
        await expect(access(migrationCompleteMarker)).resolves.toBeUndefined();
        expect((await service.status()).legacyMigrationPending).toBe(false);
    });

    it('keeps the migration marker and retries a failed retirement on startup', async () => {
        await writeFile(migrationMarker, '');
        legacyRetirementFailures = 1;

        await service.setup('migration phrase');

        await expect(access(migrationMarker)).resolves.toBeUndefined();
        await expect(access(migrationCompleteMarker)).rejects.toThrow();
        expect((await service.status()).configured).toBe(true);

        await service.reconcileAfterStartup();

        await expect(access(migrationMarker)).rejects.toThrow();
        await expect(access(migrationCompleteMarker)).resolves.toBeUndefined();
    });

    it('verifies a replacement key before removing the previous recovery key', async () => {
        const first = 'apple-bravo-cabin-delta-ember-fable-grove-harbor';
        const replacement = 'iris juniper kestrel lantern maple nimbus';
        await service.setup(first);
        execaMock.mockClear();

        await service.setup(replacement);

        const keyCalls = execaMock.mock.calls.filter((call) => call[1][0] === 'key');
        const addIndex = keyCalls.findIndex((call) => call[1][1] === 'add');
        const removeIndex = keyCalls.findIndex((call) => call[1][1] === 'remove');
        expect(addIndex).toBeGreaterThanOrEqual(0);
        expect(removeIndex).toBeGreaterThan(addIndex);
        expect(resticKeys.map((key) => key.id)).toEqual(['machine-key', 'recovery-key-2']);
        const contents = await readTree(backupDir);
        expect(contents).not.toContain(first);
        expect(contents).not.toContain(replacement);
    });

    it('resumes a verified key rotation after old-key removal is interrupted', async () => {
        const first = 'apple-bravo-cabin-delta-ember-fable-grove-harbor';
        const replacement = 'iris juniper kestrel lantern maple nimbus';
        await service.setup(first);
        recoveryKeyRemovalFailures = 1;

        await expect(service.setup(replacement)).rejects.toThrow('Restic operation failed');
        await expect(store.loadState()).resolves.toMatchObject({
            recovery_key_id: 'recovery-key-1',
            pending_recovery_key: {
                old_key_id: 'recovery-key-1',
                new_key_id: 'recovery-key-2',
                stage: 'verified',
            },
        });

        await service.setup(replacement);

        expect(resticKeys.map((key) => key.id)).toEqual(['machine-key', 'recovery-key-2']);
        const state = await store.loadState();
        expect(state).toMatchObject({ recovery_key_id: 'recovery-key-2' });
        expect(state).not.toHaveProperty('pending_recovery_key');
    });

    it('adds the phrase when the provider id points at a different Restic repository', async () => {
        const phrase = 'short';
        await service.setup(phrase);
        execaMock.mockClear();
        resticRepositoryId = 'restic-repository-2';
        resticKeys = [{ id: 'machine-key-2', user: 'root', current: true }];
        recoveryPhrases.clear();

        await service.setup(phrase);

        expect(
            execaMock.mock.calls.filter((call) => call[1][0] === 'key' && call[1][1] === 'add')
        ).toHaveLength(1);
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
