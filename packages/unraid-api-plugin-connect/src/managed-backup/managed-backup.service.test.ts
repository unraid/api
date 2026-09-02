import { ConfigService } from '@nestjs/config';
import { access, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectConfigPersister } from '../config/config.persistence.js';
import {
    cronMatches,
    IncorrectRecoveryPhraseError,
    ManagedBackupService,
    recoveryPhraseIsUsable,
} from './managed-backup.service.js';
import { ManagedBackupStore } from './managed-backup.store.js';

const execaMock = vi.hoisted(() => vi.fn());
vi.mock('execa', () => ({ execa: execaMock }));

describe('managed backup service', () => {
    let directory: string;
    let backupDir: string;
    let targetDir: string;
    let legacyFlashDir: string;
    let store: ManagedBackupStore;
    let service: ManagedBackupService;
    let requests: Array<{ path: string; method: string; body: unknown }>;
    let resticRepositoryId: string;
    let repositoryExists: boolean;
    let machinePasswordWorks: boolean;
    let migrationMarker: string;
    let migrationCompleteMarker: string;
    let unraidVersionPath: string;
    let unraidPluginDir: string;
    let managedBackupRuntimeDir: string;
    let resticKeys: Array<{ id: string; user: string; current: boolean }>;
    let resticKeySequence: number;
    let legacyRetirementFailures: number;
    let recoveryKeyRemovalFailures: number;
    let recoveryPhrases: Map<string, string>;
    let backupGate: Promise<void> | null;
    let resticLocks: Array<{
        id: string;
        time: string;
        hostname: string;
        username: string;
        pid: number;
        exclusive: boolean;
        stale: boolean;
    }>;

    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'managed-backup-service-'));
        backupDir = join(directory, 'backup');
        targetDir = join(backupDir, 'managed-target');
        legacyFlashDir = join(backupDir, 'legacy-flash');
        requests = [];
        resticRepositoryId = 'restic-repository-1';
        repositoryExists = false;
        machinePasswordWorks = false;
        resticKeys = [];
        resticKeySequence = 0;
        legacyRetirementFailures = 0;
        recoveryKeyRemovalFailures = 0;
        recoveryPhrases = new Map();
        backupGate = null;
        resticLocks = [];
        migrationMarker = join(directory, 'migration-pending');
        migrationCompleteMarker = join(directory, 'migration-complete');
        unraidVersionPath = join(directory, 'unraid-version');
        unraidPluginDir = join(directory, 'plugins');
        managedBackupRuntimeDir = join(directory, 'runtime');
        await mkdir(unraidPluginDir);
        const config = new ConfigService({
            CONNECT_MANAGED_BACKUP_TARGET_DIR: targetDir,
            CONNECT_MANAGED_BACKUP_LEGACY_FLASH_DIR: legacyFlashDir,
            CONNECT_MANAGED_BACKUP_SECRET_KEY_PATH: join(directory, 'secret_key_base'),
            CONNECT_CONTROL_PLANE_URL: 'https://connect.example',
            CONNECT_RESTIC_PATH: '/usr/local/bin/restic',
            CONNECT_MANAGED_BACKUP_MIGRATION_MARKER: migrationMarker,
            CONNECT_MANAGED_BACKUP_MIGRATION_COMPLETE_MARKER: migrationCompleteMarker,
            CONNECT_LEGACY_FLASH_BACKUP_SERVICE: '/test/rc.flash_backup',
            CONNECT_UNRAID_VERSION_PATH: unraidVersionPath,
            CONNECT_UNRAID_PLUGIN_DIR: unraidPluginDir,
            CONNECT_MANAGED_BACKUP_RUNTIME_DIR: managedBackupRuntimeDir,
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
                if (args[0] === 'cat' && args[1] === 'config') {
                    if (!repositoryExists) throw new Error('repository does not exist');
                    const passwordPath = options?.env?.RESTIC_PASSWORD_FILE;
                    if (passwordPath?.includes('/recovery-')) {
                        const phrase = await readFile(passwordPath, 'utf8');
                        if (![...recoveryPhrases.values()].includes(phrase)) {
                            throw new Error('wrong password');
                        }
                    } else if (!machinePasswordWorks) {
                        throw new Error('wrong password');
                    }
                    return { stdout: JSON.stringify({ id: resticRepositoryId, version: 2 }) };
                }
                if (args[0] === 'init') {
                    if (repositoryExists) throw new Error('repository already initialized');
                    repositoryExists = true;
                    machinePasswordWorks = true;
                    resticKeys = [{ id: 'machine-key', user: 'root', current: true }];
                }
                if (args[0] === 'list' && args[1] === 'locks') {
                    return { stdout: resticLocks.map((lock) => lock.id).join('\n') };
                }
                if (args[0] === 'cat' && args[1] === 'lock') {
                    const lock = resticLocks.find((candidate) => candidate.id === args[2]);
                    if (!lock) throw new Error('lock disappeared');
                    return {
                        stdout: JSON.stringify({
                            time: lock.time,
                            hostname: lock.hostname,
                            username: lock.username,
                            pid: lock.pid,
                            exclusive: lock.exclusive,
                        }),
                    };
                }
                if (args[0] === 'unlock') {
                    resticLocks = args.includes('--remove-all')
                        ? []
                        : resticLocks.filter((lock) => !lock.stale);
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
                                    id: key.id,
                                    userName: key.user,
                                    hostName: 'unraid',
                                    current: key.id === currentId,
                                }))
                            ),
                        };
                    }
                    return {
                        stdout: JSON.stringify(
                            resticKeys.map((key) => ({
                                id: key.id,
                                userName: key.user,
                                hostName: 'unraid',
                                current: key.current,
                            }))
                        ),
                    };
                }
                if (args[0] === 'key' && args[1] === 'add') {
                    const userIndex = args.indexOf('--user');
                    resticKeySequence += 1;
                    const passwordFileIndex = args.indexOf('--new-password-file');
                    const newPasswordPath = args[passwordFileIndex + 1];
                    const addsMachineKey = newPasswordPath === store.passwordPath;
                    const keyId = addsMachineKey
                        ? `machine-key-${resticKeySequence}`
                        : `recovery-key-${resticKeySequence}`;
                    resticKeys.push({
                        id: keyId,
                        user: userIndex >= 0 ? args[userIndex + 1] : '',
                        current: false,
                    });
                    if (addsMachineKey) machinePasswordWorks = true;
                    else recoveryPhrases.set(keyId, await readFile(newPasswordPath, 'utf8'));
                }
                if (args[0] === 'key' && args[1] === 'remove') {
                    if (recoveryKeyRemovalFailures > 0) {
                        recoveryKeyRemovalFailures -= 1;
                        throw new Error('key removal failed');
                    }
                    resticKeys = resticKeys.filter((key) => key.id !== args[2]);
                    recoveryPhrases.delete(args[2]);
                }
                if (args[0] === 'backup' && backupGate) await backupGate;
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
                        objectCount: repositoryExists ? 2 : 0,
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

    it('sets up the legacy Flash job without starting the first backup or persisting the phrase', async () => {
        const phrase = 'abcde-fghij-klmno-pqrst-uvwxy-z2345-6789a';
        const result = await service.setup(phrase);
        expect(result).toMatchObject({ repositoryId: 'repository-1', targetCreated: true });
        expect(requests.map((request) => request.path)).toEqual([
            '/backup/v1/usage',
            '/backup/v1/provision',
            '/backup/v1/provision/confirm',
            '/backup/v1/provision/finalize',
        ]);
        expect(requests[2].body).toEqual({
            repositoryId: 'repository-1',
            username: 'transport-user',
            generation: 1,
        });
        expect(requests[3].body).toEqual(requests[2].body);
        expect(execaMock.mock.calls.some((call) => call[1][0] === 'key')).toBe(true);
        expect(execaMock.mock.calls.some((call) => call[1].includes('backup'))).toBe(false);
        const keyAdd = execaMock.mock.calls.find((call) => call[1][0] === 'key' && call[1][1] === 'add');
        const phrasePath = keyAdd?.[1][keyAdd[1].indexOf('--new-password-file') + 1];
        expect(phrasePath).toMatch(new RegExp(`^${managedBackupRuntimeDir}/recovery-`));

        const contents = await readTree(backupDir);
        expect(contents).not.toContain(phrase);
        expect(contents).not.toContain('transport-secret');
        expect(await store.loadState()).toMatchObject({
            setup_complete: true,
            target_id: '8ca41aac-f15c-4eca-a1bd-5d55bf80322c',
            target_name: 'Unraid Connect Backup Storage',
            repository_id: 'repository-1',
            restic_repository_id: 'restic-repository-1',
            recovery_key_id: 'recovery-key-1',
        });
        expect(await store.loadLegacyFlashState()).toMatchObject({
            schema_version: 1,
            job_id: 'f3a9d870-146c-4f9e-b078-5bb0d9f20d0c',
        });
        expect(contents).not.toContain('recovery_key_fingerprint');
        expect(await store.isCoreReady()).toBe(true);
    });

    it('detects and unlocks an existing repository without replacing its recovery key', async () => {
        const phrase = 'existing recovery phrase';
        repositoryExists = true;
        machinePasswordWorks = false;
        resticKeys = [{ id: 'existing-recovery-key', user: 'recovery', current: true }];
        recoveryPhrases.set('existing-recovery-key', phrase);

        await expect(service.status()).resolves.toMatchObject({
            configured: false,
            repositoryInitialized: true,
        });
        await expect(service.setup(phrase)).resolves.toMatchObject({
            repositoryId: 'repository-1',
        });

        expect(execaMock.mock.calls.some((call) => call[1][0] === 'init')).toBe(false);
        const keyAdds = execaMock.mock.calls.filter(
            (call) => call[1][0] === 'key' && call[1][1] === 'add'
        );
        expect(keyAdds).toHaveLength(1);
        expect(keyAdds[0][1]).toContain(store.passwordPath);
        expect(await store.loadState()).toMatchObject({
            restic_repository_id: resticRepositoryId,
            recovery_key_id: 'existing-recovery-key',
            setup_complete: true,
        });
    });

    it('rejects an incorrect phrase for an existing repository without initializing it', async () => {
        repositoryExists = true;
        machinePasswordWorks = false;
        resticKeys = [{ id: 'existing-recovery-key', user: 'recovery', current: true }];
        recoveryPhrases.set('existing-recovery-key', 'correct phrase');

        await expect(service.setup('wrong phrase')).rejects.toBeInstanceOf(IncorrectRecoveryPhraseError);
        expect(execaMock.mock.calls.some((call) => call[1][0] === 'init')).toBe(false);
        expect(execaMock.mock.calls.some((call) => call[1][0] === 'key' && call[1][1] === 'add')).toBe(
            false
        );
    });

    it('keeps a completed target when legacy job creation fails and retries only the job', async () => {
        const ensureInitialJob = vi
            .spyOn(store, 'ensureInitialJob')
            .mockRejectedValueOnce(new Error('job store unavailable'));

        await expect(service.setup('recovery phrase')).rejects.toThrow('job store unavailable');
        await expect(store.isCoreReady()).resolves.toBe(true);
        await expect(store.loadInitialJob()).resolves.toBeNull();

        ensureInitialJob.mockRestore();
        requests = [];

        await expect(service.setup()).resolves.toMatchObject({
            repositoryId: 'repository-1',
            targetCreated: false,
        });
        expect(requests.map((request) => request.path)).toEqual(['/backup/v1/usage']);
        await expect(store.loadInitialJob()).resolves.toMatchObject({ source_type: 'flash' });
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
        expect(backup?.[1]).toContain(
            `backup-name:${Buffer.from('Flash Backup', 'utf8').toString('base64url')}`
        );
        expect(backup?.[1]).toContain('source:flash');
        expect(backup?.[1]).toContain('/boot');
        expect(forget?.[1]).toContain('job:f3a9d870-146c-4f9e-b078-5bb0d9f20d0c');
        expect(forget?.[1]).toContain('--prune');
        const unlock = execaMock.mock.calls.find((call) => call[1][0] === 'unlock');
        expect(unlock?.[1]).not.toContain('--remove-all');
        expect(execaMock.mock.calls.indexOf(unlock!)).toBeLessThan(
            execaMock.mock.calls.indexOf(forget!)
        );
    });

    it('leaves scheduled backups to Core on Unraid 8 but keeps manual backup available', async () => {
        await service.setup('recovery phrase');
        const jobsPath = join(legacyFlashDir, 'jobs.json');
        const jobs = JSON.parse(await readFile(jobsPath, 'utf8'));
        await writeFile(jobsPath, JSON.stringify([{ ...jobs[0], schedule: '* * * * *' }]));
        await writeFile(unraidVersionPath, 'version="8.0.0-beta.1"\n');
        const start = vi.spyOn(service, 'startBackup');
        const recordJobRun = vi.spyOn(store, 'recordJobRun');

        await service.scheduledBackup();

        expect(start).not.toHaveBeenCalled();
        expect(service.startBackup()).toEqual({ started: true });
        await vi.waitFor(() => {
            expect(execaMock.mock.calls.some((call) => call[1][0] === 'forget')).toBe(true);
        });
        expect(recordJobRun).not.toHaveBeenCalled();
    });

    it('leaves scheduled backups to an installed Core plugin on Unraid 7', async () => {
        await service.setup('recovery phrase');
        const jobsPath = join(legacyFlashDir, 'jobs.json');
        const jobs = JSON.parse(await readFile(jobsPath, 'utf8'));
        await writeFile(jobsPath, JSON.stringify([{ ...jobs[0], schedule: '* * * * *' }]));
        await writeFile(unraidVersionPath, 'version="7.4.0"\n');
        await writeFile(join(unraidPluginDir, 'unraid.core.dev.plg'), '');
        const start = vi.spyOn(service, 'startBackup');

        await service.scheduledBackup();

        expect(start).not.toHaveBeenCalled();
        expect(service.startBackup()).toEqual({ started: true });
        await vi.waitFor(() => {
            expect(execaMock.mock.calls.some((call) => call[1][0] === 'forget')).toBe(true);
        });
    });

    it('initializes only the missing flash job when Core already owns the repository', async () => {
        await service.setup('recovery phrase');
        await writeFile(
            join(legacyFlashDir, 'jobs.json'),
            JSON.stringify([{ id: 'u8-job', name: 'Appdata', source_type: 'shares' }])
        );
        await writeFile(unraidVersionPath, 'version="8.0.0"\n');
        requests = [];

        await expect(service.status()).resolves.toMatchObject({
            configured: false,
            repositoryConfigured: true,
            job: null,
        });
        const initialized = await service.setup();
        const jobs = JSON.parse(await readFile(join(legacyFlashDir, 'jobs.json'), 'utf8'));

        expect(initialized).toMatchObject({ targetCreated: false });
        expect(requests.map((request) => request.path)).toEqual([
            '/backup/v1/usage',
            '/backup/v1/usage',
        ]);
        expect(jobs[0]).toEqual({ id: 'u8-job', name: 'Appdata', source_type: 'shares' });
        expect(jobs[1]).toMatchObject({ source_type: 'flash', source_config: { path: '/boot' } });
        await expect(service.status()).resolves.toMatchObject({
            configured: true,
            repositoryConfigured: true,
        });
    });

    it('does not create credentials or overwrite an incompatible managed target id', async () => {
        await mkdir(targetDir, { recursive: true });
        const existing = {
            id: '8ca41aac-f15c-4eca-a1bd-5d55bf80322c',
            name: 'User S3 target',
            type: 's3',
            uri: 's3:s3.example/user-bucket',
        };
        await writeFile(join(targetDir, 'targets.json'), JSON.stringify([existing]));

        await expect(service.setup('recovery phrase')).rejects.toThrow('already in use');

        expect(JSON.parse(await readFile(join(targetDir, 'targets.json'), 'utf8'))).toEqual([existing]);
        await expect(access(store.passwordPath)).rejects.toThrow();
    });

    it('rechecks Core ownership when a queued scheduled backup starts', async () => {
        await service.setup('recovery phrase');
        await writeFile(join(unraidPluginDir, 'unraid.core.plg'), '');
        execaMock.mockClear();

        await (
            service as unknown as {
                runBackup(mode: 'manual' | 'scheduled'): Promise<void>;
            }
        ).runBackup('scheduled');

        expect(execaMock).not.toHaveBeenCalled();
    });

    it('leaves pending setup and job status untouched after Core takes ownership', async () => {
        await service.setup('recovery phrase');
        await store.saveState({
            ...(await store.loadState()),
            setup_complete: false,
            pending_generation: 2,
            pending_repository_id: 'repository-2',
        });
        await store.recordJobRun('running');
        await writeFile(unraidVersionPath, 'version="8.0.0"\n');
        const reconcilePending = vi.spyOn(service as never, 'reconcilePending' as never);
        const recordJobRun = vi.spyOn(store, 'recordJobRun');

        await expect(service.status()).resolves.toMatchObject({
            setupPending: true,
            job: { lastRunStatus: 'running' },
        });
        await service.reconcileAfterStartup();

        expect(reconcilePending).not.toHaveBeenCalled();
        expect(recordJobRun).not.toHaveBeenCalled();
    });

    it('removes stale recovery phrase files from the private runtime directory', async () => {
        await mkdir(managedBackupRuntimeDir, { recursive: true });
        const stalePhrase = join(
            managedBackupRuntimeDir,
            'recovery-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.pass'
        );
        const unrelated = join(managedBackupRuntimeDir, 'keep.txt');
        await writeFile(stalePhrase, 'customer phrase');
        await writeFile(unrelated, 'keep');

        await service.reconcileAfterStartup();

        await expect(access(stalePhrase)).rejects.toThrow();
        await expect(access(unrelated)).resolves.toBeUndefined();
    });

    it('lists repository lock metadata and removes only stale locks by default', async () => {
        await service.setup('recovery phrase');
        const staleId = 'a'.repeat(64);
        const liveId = 'b'.repeat(64);
        resticLocks = [
            {
                id: staleId,
                time: '2026-09-01T12:00:00Z',
                hostname: 'DEVGEN',
                username: 'root',
                pid: 101,
                exclusive: false,
                stale: true,
            },
            {
                id: liveId,
                time: '2026-09-01T12:01:00Z',
                hostname: 'restore-client',
                username: 'user',
                pid: 202,
                exclusive: true,
                stale: false,
            },
        ];
        execaMock.mockClear();

        await expect(service.listLocks()).resolves.toMatchObject({
            locks: [
                { id: staleId, hostname: 'DEVGEN', pid: 101, exclusive: false },
                { id: liveId, hostname: 'restore-client', pid: 202, exclusive: true },
            ],
        });
        const result = await service.unlock();

        expect(result).toMatchObject({ removedLocks: 1, remainingLocks: [{ id: liveId }] });
        const unlock = execaMock.mock.calls.find((call) => call[1][0] === 'unlock');
        expect(unlock?.[1]).not.toContain('--remove-all');
    });

    it('requires an explicit force unlock to remove live locks', async () => {
        await service.setup('recovery phrase');
        resticLocks = [
            {
                id: 'c'.repeat(64),
                time: '2026-09-01T12:00:00Z',
                hostname: 'restore-client',
                username: 'user',
                pid: 303,
                exclusive: true,
                stale: false,
            },
        ];
        execaMock.mockClear();

        const result = await service.unlock(true);

        expect(result).toMatchObject({ removedLocks: 1, remainingLocks: [] });
        const unlock = execaMock.mock.calls.find((call) => call[1][0] === 'unlock');
        expect(unlock?.[1]).toContain('--remove-all');
    });

    it('does not unlock while a local backup is running', async () => {
        await service.setup('recovery phrase');
        let releaseBackup!: () => void;
        backupGate = new Promise<void>((resolve) => {
            releaseBackup = resolve;
        });
        service.startBackup();
        await vi.waitFor(() => {
            expect(execaMock.mock.calls.some((call) => call[1][0] === 'backup')).toBe(true);
        });

        await expect(service.unlock()).rejects.toThrow();

        releaseBackup();
        await vi.waitFor(async () => {
            expect((await store.loadInitialJob())?.last_run_status).toBe('success');
        });
    });

    it('keeps status responsive while Restic is running', async () => {
        await service.setup('abcde-fghij-klmno-pqrst-uvwxy-z2345-6789a');
        let releaseBackup!: () => void;
        backupGate = new Promise<void>((resolve) => {
            releaseBackup = resolve;
        });

        expect(service.startBackup()).toEqual({ started: true });
        await vi.waitFor(() => {
            expect(execaMock.mock.calls.some((call) => call[1][0] === 'backup')).toBe(true);
        });

        const response = await Promise.race([
            service.status().then((status) => ({ state: 'resolved', status })),
            new Promise<{ state: 'blocked'; status: null }>((resolve) =>
                setTimeout(() => resolve({ state: 'blocked', status: null }), 100)
            ),
        ]);
        expect(response.state).toBe('resolved');
        expect(response.status).toMatchObject({ configured: true, running: true });

        releaseBackup();
        await vi.waitFor(async () => {
            expect((await store.loadInitialJob())?.last_run_status).toBe('success');
        });
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
