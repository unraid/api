import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import { access, chmod, mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';

import { execa } from 'execa';

import { ConnectConfigPersister } from '../config/config.persistence.js';
import { EVENTS } from '../helper/nest-tokens.js';
import { requestControlPlane } from '../tunnel/control-plane.js';
import {
    MANAGED_BACKUP_JOB_ID,
    MANAGED_BACKUP_TARGET_ID,
    MANAGED_BACKUP_TARGET_NAME,
    ManagedBackupJob,
    ManagedBackupState,
    ManagedBackupStore,
    ManagedBackupTarget,
    StagedManagedBackup,
} from './managed-backup.store.js';

interface ProvisionedRepository {
    schemaVersion: 1;
    repositoryId: string;
    repositoryUrl: string;
    username: string;
    password: string;
    generation: number;
    quotaBytes: number;
}

interface UsageResponse {
    schemaVersion: 1;
    tierId: string | null;
    quotaBytes: number;
    usedBytes: number;
    remainingBytes: number;
    objectCount: number;
    updatedAt: string;
}

interface RepositoryStateResponse {
    schemaVersion: 1;
    serverUuid: string;
    current: {
        repositoryId: string;
        generation: number;
        state: 'current';
        archivedAt: null;
        deleteAfter: null;
        usedBytes: number;
        objectCount: number;
    } | null;
}

interface ResticKey {
    id: string;
    user: string | null;
    current: boolean;
}

export interface ManagedBackupLock {
    id: string;
    createdAt: string | null;
    hostname: string | null;
    username: string | null;
    pid: number | null;
    exclusive: boolean;
}

interface PendingRecoveryKey extends Record<string, unknown> {
    operation_id: string;
    repository_id: string;
    restic_repository_id: string;
    old_key_id: string | null;
    new_key_id: string | null;
    stage: 'prepared' | 'verified';
}

const managedBackupProvider = 'Elixir.ConnectPlugin.ManagedBackupProvider';
const recoveryKeyLabelPrefix = 'unraid-managed-recovery:';
const machineKeyLabelPrefix = 'unraid-managed-machine:';

const flashExcludePresets: Record<string, string[]> = {
    system_images: ['bzimage', 'bzroot', 'bzroot-gui', 'bzfirmware', 'bzmodules'],
    plugin_archives: [
        'config/plugins/**/*.tgz',
        'config/plugins/**/*.txz',
        'config/plugins/**/*.tar.bz2',
    ],
    docker_cache: ['config/plugins/dockerMan/images/**'],
    old_plugins: ['config/plugins-old-versions/**', 'config/plugins-error/**'],
    logs: ['config/plugins/dynamix.file.integrity/logs/**', '**/*.log'],
    temp_files: [
        'config/drift',
        'config/forcesync',
        'config/random-seed',
        '**/*.tmp',
        '**/*.temp',
        '.DS_Store',
        'Thumbs.db',
        'lost+found/**',
    ],
    efi_boot: [
        'EFI-/boot/**',
        'syslinux/*.c32',
        'syslinux/*.com',
        'syslinux/*.bin',
        'syslinux/ldlinux.sys',
        'syslinux/mboot.c32',
    ],
};

export class InvalidRecoveryPhraseError extends Error {}
export class IncorrectRecoveryPhraseError extends Error {}
export class ManagedBackupBusyError extends Error {}

export function recoveryPhraseIsUsable(phrase: string): boolean {
    const byteLength = new TextEncoder().encode(phrase).byteLength;
    return (
        byteLength >= 1 &&
        byteLength <= 256 &&
        phrase === phrase.trim() &&
        !/[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}]/u.test(phrase)
    );
}

@Injectable()
export class ManagedBackupService {
    private queue: Promise<unknown> = Promise.resolve();
    private running = false;

    constructor(
        private readonly config: ConfigService,
        private readonly connect: ConnectConfigPersister,
        private readonly store: ManagedBackupStore
    ) {}

    async status() {
        const coreOwnsBackup = await this.unraidCoreOwnsBackup();
        const pendingState = await this.store.loadState();
        if (!coreOwnsBackup && Number.isSafeInteger(pendingState.pending_generation)) {
            await this.serial(() => this.reconcilePending()).catch(() => undefined);
        }
        const [state, job, usage, legacyMigrationPending, repositoryConfigured] = await Promise.all([
            this.store.loadState(),
            this.store.loadInitialJob(),
            this.loadUsage(),
            this.legacyMigrationPending(),
            this.store.isCoreReady(),
        ]);
        const repositoryState = repositoryConfigured ? await this.loadRepositoryState() : null;
        const currentRepositoryMatches =
            repositoryState === null || repositoryState.current?.repositoryId === state.repository_id;
        const effectiveRepositoryConfigured = repositoryConfigured && currentRepositoryMatches;
        const signedIn = Boolean(this.connect.getConfig().apikey);
        return {
            schemaVersion: 1,
            signedIn,
            configured: effectiveRepositoryConfigured && Boolean(job),
            repositoryConfigured: effectiveRepositoryConfigured,
            repositoryInitialized:
                effectiveRepositoryConfigured ||
                (usage.state === 'current' && usage.value.objectCount > 0),
            setupPending: Number.isSafeInteger(state.pending_generation),
            legacyMigrationPending,
            running: this.running,
            job: job
                ? {
                      id: job.id,
                      name: job.name,
                      enabled: job.enabled,
                      schedule: job.schedule,
                      lastRunAt: job.last_run_at,
                      lastRunStatus:
                          this.running || coreOwnsBackup || job.last_run_status !== 'running'
                              ? this.running
                                  ? 'running'
                                  : job.last_run_status
                              : 'failed',
                  }
                : null,
            usage,
        };
    }

    async setup(recoveryPhrase?: string) {
        return this.serial(async () => {
            if (recoveryPhrase === undefined && (await this.store.isCoreReady())) {
                const job = await this.store.ensureInitialJob();
                await this.retireLegacyFlashBackup().catch(() => undefined);
                const state = await this.store.loadState();
                const usage = await this.loadUsage();
                return {
                    schemaVersion: 1,
                    targetId: state.target_id,
                    jobId: job.id,
                    repositoryId: state.repository_id,
                    quotaBytes: usage.state === 'current' ? usage.value.quotaBytes : null,
                    targetCreated: false,
                };
            }

            const phrase = recoveryPhrase ?? '';
            if (!recoveryPhraseIsUsable(phrase)) throw new InvalidRecoveryPhraseError();
            await this.reconcilePending();
            const usage = await this.loadUsage();
            const repository = validateProvisionedRepository(
                await this.request('/backup/v1/provision', 'POST')
            );
            const { target, created } = await this.store.buildTarget(
                repository.repositoryUrl,
                repository.username
            );
            const machinePassword = await this.store.loadOrCreateMachinePassword();
            const state = await this.store.loadState();
            const locallyConfigured = await this.store.isCoreReady();
            const repositoryInitialized = usage.state === 'current' && usage.value.objectCount > 0;
            const opened = await this.ensureRepository(
                target,
                repository.password,
                phrase,
                repositoryInitialized,
                locallyConfigured
            );
            const resticRepositoryId = opened.repositoryId;
            const recoveryKeyId =
                opened.recoveryKeyId ??
                (await this.ensureRecoveryKey(target, repository, resticRepositoryId, phrase, state));
            await this.store.saveState({
                ...(await this.store.loadState()),
                schema_version: 1,
                target_id: target.id,
                target_name: MANAGED_BACKUP_TARGET_NAME,
                repository_id: repository.repositoryId,
                repository_url: repository.repositoryUrl,
                quota_bytes: repository.quotaBytes,
                restic_repository_id: resticRepositoryId,
                recovery_key_id: recoveryKeyId,
                recovery_key_added_at: new Date().toISOString(),
                setup_complete: false,
                pending_recovery_key: undefined,
            });

            const staged: StagedManagedBackup = {
                schema_version: 2,
                provider_module: managedBackupProvider,
                repository_spec: this.repositorySpec(),
                generation: repository.generation,
                repository_id: repository.repositoryId,
                quota_bytes: repository.quotaBytes,
                target_created: created,
                machine_password: machinePassword,
                target,
                transport_username: repository.username,
                transport_password: repository.password,
            };
            await this.store.saveStaging(staged);
            await this.store.saveState({
                ...(await this.store.loadState()),
                setup_complete: false,
                pending_generation: repository.generation,
                pending_repository_id: repository.repositoryId,
            });
            await this.reconcilePending();
            const job = await this.store.ensureInitialJob();
            await this.retireLegacyFlashBackup().catch(() => undefined);
            return {
                schemaVersion: 1,
                targetId: target.id,
                jobId: job.id,
                repositoryId: repository.repositoryId,
                quotaBytes: repository.quotaBytes,
                targetCreated: created,
            };
        });
    }

    startBackup(mode: 'manual' | 'scheduled' = 'manual'): { started: boolean } {
        if (this.running) return { started: false };
        this.running = true;
        void this.serial(() => this.runBackup(mode))
            .catch(() => undefined)
            .finally(() => {
                this.running = false;
            });
        return { started: true };
    }

    async listLocks(): Promise<{ schemaVersion: 1; locks: ManagedBackupLock[] }> {
        const loaded = await this.store.loadManagedTarget();
        if (!(await this.store.isCoreReady()) || !loaded) {
            throw new Error('Managed flash backup is not configured');
        }
        return {
            schemaVersion: 1,
            locks: await this.listRepositoryLocks(
                loaded.target,
                this.resticEnv(loaded.target, loaded.transportPassword)
            ),
        };
    }

    async unlock(removeAll = false): Promise<{
        schemaVersion: 1;
        removedLocks: number;
        remainingLocks: ManagedBackupLock[];
    }> {
        if (this.running) throw new ManagedBackupBusyError();
        return this.serial(async () => {
            if (this.running) throw new ManagedBackupBusyError();
            const loaded = await this.store.loadManagedTarget();
            if (!(await this.store.isCoreReady()) || !loaded) {
                throw new Error('Managed flash backup is not configured');
            }
            const env = this.resticEnv(loaded.target, loaded.transportPassword);
            const before = await this.listRepositoryLocks(loaded.target, env);
            const args = ['unlock', '--repo', loaded.target.uri];
            if (removeAll) args.push('--remove-all');
            await this.runRestic(args, env);
            const remainingLocks = await this.listRepositoryLocks(loaded.target, env);
            return {
                schemaVersion: 1,
                removedLocks: Math.max(0, before.length - remainingLocks.length),
                remainingLocks,
            };
        });
    }

    @Cron('* * * * *', { name: 'connect-managed-flash-backup' })
    async scheduledBackup(): Promise<void> {
        if (this.running || (await this.unraidCoreOwnsBackup())) return;
        const job = await this.store.loadInitialJob().catch(() => null);
        if (job?.enabled && job.schedule && cronMatches(job.schedule, new Date())) {
            this.startBackup('scheduled');
        }
    }

    private async unraidCoreOwnsBackup(): Promise<boolean> {
        const versionPath =
            this.config.get<string>('CONNECT_UNRAID_VERSION_PATH') ?? '/etc/unraid-version';
        const version = await readFile(versionPath, 'utf8').catch(() => '');
        const major = Number(version.match(/^version\s*=\s*"?(\d+)/m)?.[1]);
        if (Number.isSafeInteger(major) && major >= 8) return true;

        const pluginDir = this.config.get<string>('CONNECT_UNRAID_PLUGIN_DIR') ?? '/boot/config/plugins';
        const plugins = await readdir(pluginDir).catch(() => []);
        return plugins.some((plugin) => /^unraid\.core(?:\.[A-Za-z0-9_-]+)*\.plg$/.test(plugin));
    }

    @OnEvent('app.ready', { async: true })
    @OnEvent(EVENTS.LOGIN, { async: true })
    async reconcileAfterStartup(): Promise<void> {
        await this.cleanupRecoveryPhraseFiles();
        const coreOwnsBackup = await this.unraidCoreOwnsBackup();
        if (!coreOwnsBackup) {
            await this.serial(() => this.reconcilePending()).catch(() => undefined);
        }
        await this.retireLegacyFlashBackup().catch(() => undefined);
        const job = await this.store.loadInitialJob().catch(() => null);
        if (
            !coreOwnsBackup &&
            job?.last_run_status === 'running' &&
            !(await this.unraidCoreOwnsBackup())
        ) {
            await this.store.recordJobRun('failed');
        }
    }

    private serial<T>(work: () => Promise<T>): Promise<T> {
        const result = this.queue.catch(() => undefined).then(work);
        this.queue = result;
        return result;
    }

    private async reconcilePending(): Promise<void> {
        const state = await this.store.loadState();
        if (!Number.isSafeInteger(state.pending_generation)) return;
        const staged = await this.store.loadStaging();
        if (
            !staged ||
            staged.generation !== state.pending_generation ||
            staged.repository_id !== state.pending_repository_id
        ) {
            throw new Error('Managed backup setup is incomplete');
        }
        const credentialReference = {
            repositoryId: staged.repository_id,
            username: staged.transport_username,
            generation: staged.generation,
        };
        const confirmation = await this.request(
            '/backup/v1/provision/confirm',
            'POST',
            credentialReference
        );
        if (!isObject(confirmation) || confirmation.ok !== true) {
            throw new Error('Connect returned an invalid backup confirmation');
        }
        await this.store.saveTargetWithPassword(
            staged.target,
            staged.machine_password,
            staged.transport_password
        );
        const finalization = await this.request(
            '/backup/v1/provision/finalize',
            'POST',
            credentialReference
        );
        if (!isObject(finalization) || finalization.ok !== true) {
            throw new Error('Connect returned an invalid backup finalization');
        }
        const current = await this.store.loadState();
        if (
            current.repository_id !== staged.repository_id ||
            typeof current.restic_repository_id !== 'string' ||
            typeof current.recovery_key_id !== 'string' ||
            current.target_id !== MANAGED_BACKUP_TARGET_ID ||
            current.target_name !== MANAGED_BACKUP_TARGET_NAME
        ) {
            throw new Error('Managed backup recovery key was not recorded');
        }
        const complete: ManagedBackupState = {
            ...current,
            setup_complete: true,
            published_generation: staged.generation,
            setup_completed_at: new Date().toISOString(),
        };
        delete complete.pending_generation;
        delete complete.pending_repository_id;
        await this.store.saveState(complete);
        await this.store.deleteStaging();
    }

    private migrationMarkerPath(): string {
        return (
            this.config.get<string>('CONNECT_MANAGED_BACKUP_MIGRATION_MARKER') ??
            '/boot/config/plugins/dynamix.my.servers/managed-backup-migration-pending'
        );
    }

    private migrationCompleteMarkerPath(): string {
        return (
            this.config.get<string>('CONNECT_MANAGED_BACKUP_MIGRATION_COMPLETE_MARKER') ??
            '/boot/config/plugins/dynamix.my.servers/managed-backup-migration-complete'
        );
    }

    private async legacyMigrationPending(): Promise<boolean> {
        return access(this.migrationMarkerPath()).then(
            () => true,
            () => false
        );
    }

    private async retireLegacyFlashBackup(): Promise<void> {
        if (!(await this.legacyMigrationPending())) return;
        if (!(await this.store.isCoreReady())) return;
        await execa(
            this.config.get<string>('CONNECT_LEGACY_FLASH_BACKUP_SERVICE') ??
                '/etc/rc.d/rc.flash_backup',
            ['retire']
        );
        await writeFile(this.migrationCompleteMarkerPath(), '', { mode: 0o600 });
        await chmod(this.migrationCompleteMarkerPath(), 0o600);
        await unlink(this.migrationMarkerPath());
    }

    private async runBackup(mode: 'manual' | 'scheduled'): Promise<void> {
        if (mode === 'scheduled' && (await this.unraidCoreOwnsBackup())) return;
        const job = await this.store.loadInitialJob();
        const loaded = await this.store.loadManagedTarget();
        if (!(await this.store.isCoreReady()) || !job?.enabled || !loaded) {
            throw new Error('Managed flash backup is not configured');
        }
        try {
            const env = this.resticEnv(loaded.target, loaded.transportPassword);
            const tags = [`job:${job.id}`, 'source:flash'];
            if (
                typeof job.name === 'string' &&
                job.name.trim() &&
                Buffer.byteLength(job.name, 'utf8') <= 256
            ) {
                tags.splice(1, 0, `backup-name:${Buffer.from(job.name, 'utf8').toString('base64url')}`);
            }
            const backupArgs = ['backup', '--repo', loaded.target.uri, '--json'];
            for (const tag of tags) backupArgs.push('--tag', tag);
            for (const pattern of jobExcludePatterns(job)) backupArgs.push('--exclude', pattern);
            backupArgs.push(...job.flags.filter((flag) => typeof flag === 'string'));
            backupArgs.push(
                typeof job.source_config.path === 'string' ? job.source_config.path : '/boot'
            );
            await this.runRestic(backupArgs, env);

            if (loaded.target.auto_unlock) {
                await this.runRestic(['unlock', '--repo', loaded.target.uri], env).catch(
                    () => undefined
                );
            }
            const retentionArgs = ['forget', '--repo', loaded.target.uri, '--json'];
            appendRetention(retentionArgs, job.retention);
            retentionArgs.push('--tag', `job:${job.id}`, '--prune');
            await this.runRestic(retentionArgs, env);
            if (!(await this.unraidCoreOwnsBackup())) await this.store.recordJobRun('success');
        } catch {
            if (!(await this.unraidCoreOwnsBackup())) await this.store.recordJobRun('failed');
            throw new Error('Managed flash backup failed');
        }
    }

    private async ensureRepository(
        target: ManagedBackupTarget,
        transportPassword: string,
        phrase: string,
        repositoryInitialized: boolean,
        locallyConfigured: boolean
    ): Promise<{ repositoryId: string; recoveryKeyId: string | null }> {
        const env = this.resticEnv(target, transportPassword);
        try {
            const repositoryId = await this.readResticRepositoryId(target, env);
            if (!locallyConfigured && repositoryInitialized) {
                const recoveryKeyId = await this.existingRecoveryKeyId(
                    target,
                    transportPassword,
                    phrase,
                    repositoryId
                );
                return { repositoryId, recoveryKeyId };
            }
            return { repositoryId, recoveryKeyId: null };
        } catch {
            if (repositoryInitialized) {
                return this.unlockExistingRepository(target, transportPassword, phrase);
            }
            await this.runRestic(['init', '--repo', target.uri], env);
            return {
                repositoryId: await this.readResticRepositoryId(target, env),
                recoveryKeyId: null,
            };
        }
    }

    private async unlockExistingRepository(
        target: ManagedBackupTarget,
        transportPassword: string,
        phrase: string
    ): Promise<{ repositoryId: string; recoveryKeyId: string }> {
        let repositoryId: string;
        let recoveryKeyId: string;
        try {
            repositoryId = await this.recoveryKeyRepositoryId(target, transportPassword, phrase);
            recoveryKeyId = await this.recoveryPhraseKeyId(target, transportPassword, phrase);
        } catch {
            throw new IncorrectRecoveryPhraseError();
        }

        const label = machineKeyLabelPrefix + randomUUID();
        await this.withRecoveryPhraseFile(phrase, async (phrasePath) => {
            await this.runRestic(
                [
                    'key',
                    'add',
                    '--repo',
                    target.uri,
                    '--new-password-file',
                    target.password_file,
                    '--user',
                    label,
                    '--host',
                    'unraid',
                ],
                {
                    ...this.resticEnv(target, transportPassword),
                    RESTIC_PASSWORD_FILE: phrasePath,
                }
            );
        });
        if (
            (await this.readResticRepositoryId(target, this.resticEnv(target, transportPassword))) !==
            repositoryId
        ) {
            throw new Error('Managed backup machine key verification failed');
        }
        return { repositoryId, recoveryKeyId };
    }

    private async existingRecoveryKeyId(
        target: ManagedBackupTarget,
        transportPassword: string,
        phrase: string,
        repositoryId: string
    ): Promise<string> {
        try {
            if (
                (await this.recoveryKeyRepositoryId(target, transportPassword, phrase)) !== repositoryId
            ) {
                throw new Error('Repository mismatch');
            }
            return await this.recoveryPhraseKeyId(target, transportPassword, phrase);
        } catch {
            throw new IncorrectRecoveryPhraseError();
        }
    }

    private async readResticRepositoryId(
        target: ManagedBackupTarget,
        env: Record<string, string>
    ): Promise<string> {
        const output = await this.runRestic(['cat', 'config', '--repo', target.uri], env);
        const config: unknown = JSON.parse(output);
        if (!isObject(config) || typeof config.id !== 'string' || !config.id) {
            throw new Error('Restic returned an invalid repository config');
        }
        return config.id;
    }

    private repositorySpec(): Record<string, unknown> {
        return {
            target_id: MANAGED_BACKUP_TARGET_ID,
            target_name: MANAGED_BACKUP_TARGET_NAME,
            initial_job: null,
        };
    }

    private async ensureRecoveryKey(
        target: ManagedBackupTarget,
        repository: ProvisionedRepository,
        resticRepositoryId: string,
        phrase: string,
        state: ManagedBackupState
    ): Promise<string> {
        const currentKeyId =
            typeof state.recovery_key_id === 'string' && state.recovery_key_id
                ? state.recovery_key_id
                : null;
        const pending = this.pendingRecoveryKey(state, repository.repositoryId, resticRepositoryId);
        const phraseKeyId = await this.recoveryPhraseKeyId(target, repository.password, phrase).catch(
            () => null
        );
        if (
            pending?.stage === 'verified' &&
            pending.new_key_id &&
            phraseKeyId === pending.new_key_id &&
            (await this.recoveryKeyPresent(target, repository.password, pending.new_key_id))
        ) {
            if (pending.old_key_id && pending.old_key_id !== pending.new_key_id) {
                await this.removeRecoveryKeyIfPresent(target, repository.password, pending.old_key_id);
            }
            return pending.new_key_id;
        }
        const recorded =
            state.repository_id === repository.repositoryId &&
            state.restic_repository_id === resticRepositoryId &&
            currentKeyId !== null;
        if (
            recorded &&
            phraseKeyId === currentKeyId &&
            (await this.recoveryKeyPresent(target, repository.password, currentKeyId))
        ) {
            return currentKeyId;
        }

        const operation = this.recoveryKeyOperation(state, repository.repositoryId, resticRepositoryId);
        const label = recoveryKeyLabelPrefix + operation.operation_id;
        await this.store.saveState({ ...state, pending_recovery_key: operation });
        await this.removeKeysWithLabel(target, repository.password, label);
        const newKeyId = await this.addRecoveryKey(target, repository.password, phrase, label);
        if (
            (await this.recoveryKeyRepositoryId(target, repository.password, phrase)) !==
                resticRepositoryId ||
            (await this.recoveryPhraseKeyId(target, repository.password, phrase)) !== newKeyId
        ) {
            throw new Error('Managed backup recovery key verification failed');
        }
        await this.store.saveState({
            ...(await this.store.loadState()),
            pending_recovery_key: { ...operation, new_key_id: newKeyId, stage: 'verified' },
        });
        if (operation.old_key_id && operation.old_key_id !== newKeyId) {
            await this.removeRecoveryKeyIfPresent(target, repository.password, operation.old_key_id);
        }
        return newKeyId;
    }

    private pendingRecoveryKey(
        state: ManagedBackupState,
        repositoryId: string,
        resticRepositoryId: string
    ): PendingRecoveryKey | null {
        const pending = state.pending_recovery_key;
        if (
            !isObject(pending) ||
            typeof pending.operation_id !== 'string' ||
            !pending.operation_id ||
            pending.repository_id !== repositoryId ||
            pending.restic_repository_id !== resticRepositoryId
        ) {
            return null;
        }
        return {
            operation_id: pending.operation_id,
            repository_id: repositoryId,
            restic_repository_id: resticRepositoryId,
            old_key_id: typeof pending.old_key_id === 'string' ? pending.old_key_id : null,
            new_key_id: typeof pending.new_key_id === 'string' ? pending.new_key_id : null,
            stage: pending.stage === 'verified' ? 'verified' : 'prepared',
        };
    }

    private recoveryKeyOperation(
        state: ManagedBackupState,
        repositoryId: string,
        resticRepositoryId: string
    ): PendingRecoveryKey {
        const pending = this.pendingRecoveryKey(state, repositoryId, resticRepositoryId);
        if (pending) return pending;
        return {
            operation_id: randomUUID(),
            repository_id: repositoryId,
            restic_repository_id: resticRepositoryId,
            old_key_id: typeof state.recovery_key_id === 'string' ? state.recovery_key_id : null,
            new_key_id: null,
            stage: 'prepared',
        };
    }

    private async listRecoveryKeys(
        target: ManagedBackupTarget,
        transportPassword: string
    ): Promise<ResticKey[]> {
        const output = await this.runRestic(
            ['key', 'list', '--json', '--repo', target.uri],
            this.resticEnv(target, transportPassword)
        );
        const value: unknown = JSON.parse(output);
        if (!Array.isArray(value)) throw new Error('Restic returned an invalid key list');
        return value.map((key) => {
            if (!isObject(key) || typeof key.id !== 'string' || !key.id) {
                throw new Error('Restic returned an invalid key list');
            }
            return {
                id: key.id,
                user: typeof key.userName === 'string' ? key.userName : null,
                current: key.current === true,
            };
        });
    }

    private async recoveryKeyPresent(
        target: ManagedBackupTarget,
        transportPassword: string,
        keyId: string
    ): Promise<boolean> {
        return (await this.listRecoveryKeys(target, transportPassword)).some((key) => key.id === keyId);
    }

    private async removeKeysWithLabel(
        target: ManagedBackupTarget,
        transportPassword: string,
        label: string
    ): Promise<void> {
        const keys = await this.listRecoveryKeys(target, transportPassword);
        for (const key of keys) {
            if (key.user === label) await this.removeRecoveryKey(target, transportPassword, key.id);
        }
    }

    private async removeRecoveryKey(
        target: ManagedBackupTarget,
        transportPassword: string,
        keyId: string
    ): Promise<void> {
        await this.runRestic(
            ['key', 'remove', keyId, '--repo', target.uri],
            this.resticEnv(target, transportPassword)
        );
    }

    private async removeRecoveryKeyIfPresent(
        target: ManagedBackupTarget,
        transportPassword: string,
        keyId: string
    ): Promise<void> {
        if (await this.recoveryKeyPresent(target, transportPassword, keyId)) {
            await this.removeRecoveryKey(target, transportPassword, keyId);
        }
    }

    private async addRecoveryKey(
        target: ManagedBackupTarget,
        transportPassword: string,
        phrase: string,
        label: string
    ): Promise<string> {
        const before = await this.listRecoveryKeys(target, transportPassword);
        await this.withRecoveryPhraseFile(phrase, (phrasePath) =>
            this.runRestic(
                [
                    'key',
                    'add',
                    '--repo',
                    target.uri,
                    '--new-password-file',
                    phrasePath,
                    '--user',
                    label,
                    '--host',
                    'unraid',
                ],
                this.resticEnv(target, transportPassword)
            )
        );
        const beforeIds = new Set(before.map((key) => key.id));
        const added = (await this.listRecoveryKeys(target, transportPassword)).filter(
            (key) => key.user === label && !beforeIds.has(key.id)
        );
        if (added.length !== 1) throw new Error('Managed backup recovery key was not observed');
        return added[0].id;
    }

    private async recoveryKeyRepositoryId(
        target: ManagedBackupTarget,
        transportPassword: string,
        phrase: string
    ): Promise<string> {
        return this.withRecoveryPhraseFile(phrase, (phrasePath) =>
            this.readResticRepositoryId(target, {
                ...this.resticEnv(target, transportPassword),
                RESTIC_PASSWORD_FILE: phrasePath,
            })
        );
    }

    private async recoveryPhraseKeyId(
        target: ManagedBackupTarget,
        transportPassword: string,
        phrase: string
    ): Promise<string> {
        return this.withRecoveryPhraseFile(phrase, async (phrasePath) => {
            const output = await this.runRestic(['key', 'list', '--json', '--repo', target.uri], {
                ...this.resticEnv(target, transportPassword),
                RESTIC_PASSWORD_FILE: phrasePath,
            });
            const value: unknown = JSON.parse(output);
            if (!Array.isArray(value)) throw new Error('Restic returned an invalid key list');
            const current = value.filter((key) => isObject(key) && key.current === true);
            if (current.length !== 1 || typeof current[0].id !== 'string' || !current[0].id) {
                throw new Error('Restic did not identify the recovery key');
            }
            return current[0].id;
        });
    }

    private async withRecoveryPhraseFile<T>(
        phrase: string,
        operation: (phrasePath: string) => Promise<T>
    ): Promise<T> {
        const runtimeDir = this.recoveryPhraseRuntimeDir();
        await mkdir(runtimeDir, { recursive: true, mode: 0o700 });
        await chmod(runtimeDir, 0o700);
        const phrasePath = `${runtimeDir}/recovery-${randomUUID()}.pass`;
        try {
            await writeFile(phrasePath, phrase, { mode: 0o600, flag: 'wx' });
            await chmod(phrasePath, 0o600);
            return await operation(phrasePath);
        } finally {
            await unlink(phrasePath).catch(() => undefined);
        }
    }

    private recoveryPhraseRuntimeDir(): string {
        return (
            this.config.get<string>('CONNECT_MANAGED_BACKUP_RUNTIME_DIR') ??
            '/run/unraid-connect/managed-backup'
        );
    }

    private async cleanupRecoveryPhraseFiles(): Promise<void> {
        const runtimeDir = this.recoveryPhraseRuntimeDir();
        const entries = await readdir(runtimeDir).catch(() => []);
        await Promise.all(
            entries
                .filter((entry) => /^recovery-[0-9a-f-]+\.pass$/.test(entry))
                .map((entry) => unlink(`${runtimeDir}/${entry}`).catch(() => undefined))
        );
    }

    private resticEnv(target: ManagedBackupTarget, transportPassword: string): Record<string, string> {
        return {
            RESTIC_PASSWORD_FILE: target.password_file,
            RESTIC_REST_USERNAME: target.env.RESTIC_REST_USERNAME,
            RESTIC_REST_PASSWORD: transportPassword,
            RESTIC_CACHE_DIR:
                this.config.get<string>('CONNECT_MANAGED_BACKUP_CACHE_DIR') ??
                '/var/tmp/unraid-restic-cache',
        };
    }

    private async listRepositoryLocks(
        target: ManagedBackupTarget,
        env: Record<string, string>
    ): Promise<ManagedBackupLock[]> {
        const output = await this.runRestic(['list', 'locks', '--repo', target.uri, '--no-lock'], env);
        const lockIds = output
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => /^[0-9a-f]{64}$/.test(line));
        const locks = await Promise.all(
            lockIds.map(async (id): Promise<ManagedBackupLock | null> => {
                try {
                    const lockOutput = await this.runRestic(
                        ['cat', 'lock', id, '--repo', target.uri, '--no-lock'],
                        env
                    );
                    const value: unknown = JSON.parse(lockOutput);
                    if (!isObject(value)) return null;
                    return {
                        id,
                        createdAt: typeof value.time === 'string' ? value.time : null,
                        hostname: typeof value.hostname === 'string' ? value.hostname : null,
                        username: typeof value.username === 'string' ? value.username : null,
                        pid: Number.isSafeInteger(value.pid) ? Number(value.pid) : null,
                        exclusive: value.exclusive === true,
                    };
                } catch {
                    return null;
                }
            })
        );
        return locks.filter((lock): lock is ManagedBackupLock => lock !== null);
    }

    private async runRestic(args: string[], env: Record<string, string>): Promise<string> {
        try {
            const result = await execa(
                this.config.get<string>('CONNECT_RESTIC_PATH') ?? '/usr/local/bin/restic',
                args,
                { env }
            );
            return result.stdout;
        } catch {
            throw new Error('Restic operation failed');
        }
    }

    private async loadUsage(): Promise<
        { state: 'current'; value: UsageResponse } | { state: 'unavailable' }
    > {
        if (!this.connect.getConfig().apikey) return { state: 'unavailable' };
        try {
            const usage = validateUsage(await this.request('/backup/v1/usage', 'GET'));
            return { state: 'current', value: usage };
        } catch {
            return { state: 'unavailable' };
        }
    }

    private async loadRepositoryState(): Promise<RepositoryStateResponse | null> {
        if (!this.connect.getConfig().apikey) return null;
        try {
            return validateRepositoryState(await this.request('/backup/v1/repository-state', 'GET'));
        } catch {
            return null;
        }
    }

    private request(path: string, method: 'GET' | 'POST', body: object = {}): Promise<unknown> {
        return requestControlPlane(
            this.config.get<string>('CONNECT_CONTROL_PLANE_URL') ?? '',
            this.connect.getConfig().apikey,
            path,
            method,
            body
        );
    }
}

function validateProvisionedRepository(value: unknown): ProvisionedRepository {
    if (!isObject(value) || value.schemaVersion !== 1) throw new Error('Invalid backup response');
    const url = typeof value.repositoryUrl === 'string' ? new URL(value.repositoryUrl) : null;
    if (
        typeof value.repositoryId !== 'string' ||
        !url ||
        url.protocol !== 'https:' ||
        Boolean(url.username || url.password || url.search || url.hash) ||
        typeof value.username !== 'string' ||
        !value.username ||
        typeof value.password !== 'string' ||
        !value.password ||
        !Number.isSafeInteger(value.generation) ||
        Number(value.generation) < 1 ||
        !Number.isSafeInteger(value.quotaBytes) ||
        Number(value.quotaBytes) < 1
    ) {
        throw new Error('Invalid backup response');
    }
    return value as unknown as ProvisionedRepository;
}

function validateRepositoryState(value: unknown): RepositoryStateResponse {
    if (
        !isObject(value) ||
        value.schemaVersion !== 1 ||
        typeof value.serverUuid !== 'string' ||
        !value.serverUuid ||
        (value.current !== null &&
            (!isObject(value.current) ||
                typeof value.current.repositoryId !== 'string' ||
                !value.current.repositoryId ||
                !Number.isSafeInteger(value.current.generation) ||
                value.current.state !== 'current' ||
                value.current.archivedAt !== null ||
                value.current.deleteAfter !== null ||
                !Number.isSafeInteger(value.current.usedBytes) ||
                !Number.isSafeInteger(value.current.objectCount)))
    ) {
        throw new Error('Invalid backup repository state');
    }
    return value as unknown as RepositoryStateResponse;
}

function validateUsage(value: unknown): UsageResponse {
    if (
        !isObject(value) ||
        value.schemaVersion !== 1 ||
        !(typeof value.tierId === 'string' || value.tierId === null) ||
        !nonNegativeInteger(value.quotaBytes) ||
        !nonNegativeInteger(value.usedBytes) ||
        !nonNegativeInteger(value.remainingBytes) ||
        !nonNegativeInteger(value.objectCount) ||
        typeof value.updatedAt !== 'string'
    ) {
        throw new Error('Invalid backup usage');
    }
    return value as unknown as UsageResponse;
}

function nonNegativeInteger(value: unknown): boolean {
    return Number.isSafeInteger(value) && Number(value) >= 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function appendRetention(args: string[], retention: Record<string, number>): void {
    const fields = [
        ['keep_last', '--keep-last'],
        ['keep_hourly', '--keep-hourly'],
        ['keep_daily', '--keep-daily'],
        ['keep_weekly', '--keep-weekly'],
        ['keep_monthly', '--keep-monthly'],
        ['keep_yearly', '--keep-yearly'],
    ] as const;
    for (const [field, flag] of fields) {
        const value = retention[field];
        if (Number.isSafeInteger(value) && value > 0) args.push(`${flag}=${value}`);
    }
}

function jobExcludePatterns(job: ManagedBackupJob): string[] {
    const presets = Array.isArray(job.source_config.exclude_presets)
        ? job.source_config.exclude_presets
        : [];
    const custom = Array.isArray(job.exclude_patterns) ? job.exclude_patterns : [];
    return [
        ...new Set([
            ...presets.flatMap((preset) =>
                typeof preset === 'string' ? (flashExcludePresets[preset] ?? []) : []
            ),
            ...custom.filter((pattern) => typeof pattern === 'string'),
        ]),
    ];
}

export function cronMatches(expression: string, date: Date): boolean {
    const fields = expression.trim().split(/\s+/);
    if (fields.length !== 5) return false;
    const values = [
        date.getMinutes(),
        date.getHours(),
        date.getDate(),
        date.getMonth() + 1,
        date.getDay(),
    ];
    const bounds = [
        [0, 59],
        [0, 23],
        [1, 31],
        [1, 12],
        [0, 7],
    ] as const;
    const matches = fields.map((field, index) =>
        cronFieldMatches(field, values[index], bounds[index][0], bounds[index][1], index === 4)
    );
    if (matches.some((match) => match === null)) return false;
    const dayOfMonthWildcard = fields[2] === '*';
    const dayOfWeekWildcard = fields[4] === '*';
    const dayMatches =
        dayOfMonthWildcard || dayOfWeekWildcard ? matches[2] && matches[4] : matches[2] || matches[4];
    return Boolean(matches[0] && matches[1] && dayMatches && matches[3]);
}

function cronFieldMatches(
    field: string,
    value: number,
    minimum: number,
    maximum: number,
    weekday: boolean
): boolean | null {
    let valid = false;
    for (const part of field.split(',')) {
        const [rangeText, stepText] = part.split('/');
        const step = stepText === undefined ? 1 : Number(stepText);
        if (!Number.isInteger(step) || step < 1) return null;
        let start: number;
        let end: number;
        if (rangeText === '*') {
            start = minimum;
            end = maximum;
        } else if (rangeText.includes('-')) {
            const values = rangeText.split('-').map(Number);
            if (values.length !== 2) return null;
            [start, end] = values;
        } else {
            start = Number(rangeText);
            end = start;
        }
        if (
            !Number.isInteger(start) ||
            !Number.isInteger(end) ||
            start < minimum ||
            end > maximum ||
            start > end
        ) {
            return null;
        }
        const normalizedValue = weekday && value === 0 && end === 7 ? 7 : value;
        if (normalizedValue >= start && normalizedValue <= end && (normalizedValue - start) % step === 0)
            valid = true;
    }
    return valid;
}
