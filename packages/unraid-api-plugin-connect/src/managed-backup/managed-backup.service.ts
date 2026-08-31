import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { createHash, randomUUID } from 'node:crypto';
import { access, chmod, unlink, writeFile } from 'node:fs/promises';

import { execa } from 'execa';

import { ConnectConfigPersister } from '../config/config.persistence.js';
import { EVENTS } from '../helper/nest-tokens.js';
import { requestControlPlane } from '../tunnel/control-plane.js';
import {
    MANAGED_BACKUP_JOB_ID,
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
        await this.serial(() => this.reconcilePending()).catch(() => undefined);
        const [state, job, usage, legacyMigrationPending] = await Promise.all([
            this.store.loadState(),
            this.store.loadInitialJob(),
            this.loadUsage(),
            this.legacyMigrationPending(),
        ]);
        const signedIn = Boolean(this.connect.getConfig().apikey);
        return {
            schemaVersion: 1,
            signedIn,
            configured: state.setup_complete === true,
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
                          this.running || job.last_run_status !== 'running'
                              ? this.running
                                  ? 'running'
                                  : job.last_run_status
                              : 'failed',
                  }
                : null,
            usage,
        };
    }

    async setup(recoveryPhrase: string) {
        const phrase = recoveryPhrase;
        if (!recoveryPhraseIsUsable(phrase)) throw new InvalidRecoveryPhraseError();
        return this.serial(async () => {
            await this.reconcilePending();
            const repository = validateProvisionedRepository(
                await this.request('/backup/v1/provision', 'POST')
            );
            const machinePassword = await this.store.loadOrCreateMachinePassword();
            const { target, created } = await this.store.buildTarget(
                repository.repositoryUrl,
                repository.username
            );
            const resticRepositoryId = await this.ensureRepository(target, repository.password);

            const fingerprint = createHash('sha256').update(phrase).digest('hex');
            const state = await this.store.loadState();
            const recordMatches =
                state.repository_id === repository.repositoryId &&
                state.restic_repository_id === resticRepositoryId &&
                state.recovery_key_fingerprint === fingerprint;
            const unlocksRecordedRepository =
                recordMatches &&
                (await this.recoveryKeyRepositoryId(target, repository.password, phrase).catch(
                    () => null
                )) === resticRepositoryId;
            if (!unlocksRecordedRepository) {
                await this.addRecoveryKey(target, repository.password, phrase);
                const verified = await this.recoveryKeyRepositoryId(target, repository.password, phrase);
                if (verified !== resticRepositoryId) {
                    throw new Error('Managed backup recovery key verification failed');
                }
            }
            await this.store.saveState({
                ...state,
                schema_version: 1,
                repository_id: repository.repositoryId,
                repository_url: repository.repositoryUrl,
                restic_repository_id: resticRepositoryId,
                recovery_key_fingerprint: fingerprint,
                recovery_key_added_at: new Date().toISOString(),
                setup_complete: false,
            });

            const staged: StagedManagedBackup = {
                schema_version: 1,
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
            return {
                schemaVersion: 1,
                targetId: target.id,
                jobId: MANAGED_BACKUP_JOB_ID,
                repositoryId: repository.repositoryId,
                quotaBytes: repository.quotaBytes,
                targetCreated: created,
            };
        });
    }

    startBackup(): { started: boolean } {
        if (this.running) return { started: false };
        this.running = true;
        void this.serial(() => this.runBackup())
            .catch(() => undefined)
            .finally(() => {
                this.running = false;
            });
        return { started: true };
    }

    @Cron('* * * * *', { name: 'connect-managed-flash-backup' })
    async scheduledBackup(): Promise<void> {
        if (this.running) return;
        const job = await this.store.loadInitialJob().catch(() => null);
        if (job?.enabled && job.schedule && cronMatches(job.schedule, new Date())) this.startBackup();
    }

    @OnEvent('app.ready', { async: true })
    @OnEvent(EVENTS.LOGIN, { async: true })
    async reconcileAfterStartup(): Promise<void> {
        await this.serial(() => this.reconcilePending()).catch(() => undefined);
        await this.retireLegacyFlashBackup().catch(() => undefined);
        const job = await this.store.loadInitialJob().catch(() => null);
        if (job?.last_run_status === 'running') await this.store.recordJobRun('failed');
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
        const confirmation = await this.request('/backup/v1/provision/confirm', 'POST', {
            generation: staged.generation,
        });
        if (!isObject(confirmation) || confirmation.ok !== true) {
            throw new Error('Connect returned an invalid backup confirmation');
        }
        await this.store.saveTargetWithPassword(
            staged.target,
            staged.machine_password,
            staged.transport_password
        );
        await this.store.ensureInitialJob();
        const current = await this.store.loadState();
        if (
            current.repository_id !== staged.repository_id ||
            typeof current.restic_repository_id !== 'string' ||
            typeof current.recovery_key_fingerprint !== 'string'
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
        await this.retireLegacyFlashBackup().catch(() => undefined);
    }

    private migrationMarkerPath(): string {
        return (
            this.config.get<string>('CONNECT_MANAGED_BACKUP_MIGRATION_MARKER') ??
            '/boot/config/plugins/dynamix.my.servers/managed-backup-migration-pending'
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
        const state = await this.store.loadState();
        if (state.setup_complete !== true) return;
        await execa(
            this.config.get<string>('CONNECT_LEGACY_FLASH_BACKUP_SERVICE') ??
                '/etc/rc.d/rc.flash_backup',
            ['retire']
        );
        await unlink(this.migrationMarkerPath());
    }

    private async runBackup(): Promise<void> {
        const state = await this.store.loadState();
        const job = await this.store.loadInitialJob();
        const loaded = await this.store.loadManagedTarget();
        if (state.setup_complete !== true || !job?.enabled || !loaded) {
            throw new Error('Managed flash backup is not configured');
        }
        await this.store.recordJobRun('running');
        try {
            const env = this.resticEnv(loaded.target, loaded.transportPassword);
            const tags = [`job:${job.id}`, 'source:flash'];
            const backupArgs = ['backup', '--repo', loaded.target.uri, '--json'];
            for (const tag of tags) backupArgs.push('--tag', tag);
            for (const pattern of jobExcludePatterns(job)) backupArgs.push('--exclude', pattern);
            backupArgs.push(...job.flags.filter((flag) => typeof flag === 'string'));
            backupArgs.push(
                typeof job.source_config.path === 'string' ? job.source_config.path : '/boot'
            );
            await this.runRestic(backupArgs, env);

            const retentionArgs = ['forget', '--repo', loaded.target.uri, '--json'];
            appendRetention(retentionArgs, job.retention);
            retentionArgs.push('--tag', `job:${job.id}`, '--prune');
            await this.runRestic(retentionArgs, env);
            await this.store.recordJobRun('success');
        } catch {
            await this.store.recordJobRun('failed');
            throw new Error('Managed flash backup failed');
        }
    }

    private async ensureRepository(
        target: ManagedBackupTarget,
        transportPassword: string
    ): Promise<string> {
        const env = this.resticEnv(target, transportPassword);
        try {
            return await this.readResticRepositoryId(target, env);
        } catch {
            await this.runRestic(['init', '--repo', target.uri], env);
            return this.readResticRepositoryId(target, env);
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

    private async addRecoveryKey(
        target: ManagedBackupTarget,
        transportPassword: string,
        phrase: string
    ): Promise<void> {
        await this.withRecoveryPhraseFile(phrase, async (phrasePath) => {
            await this.runRestic(
                ['key', 'add', '--repo', target.uri, '--new-password-file', phrasePath],
                this.resticEnv(target, transportPassword)
            );
        });
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

    private async withRecoveryPhraseFile<T>(
        phrase: string,
        operation: (phrasePath: string) => Promise<T>
    ): Promise<T> {
        const phrasePath = `${this.store.configDir}/.credentials/recovery-${randomUUID()}.pass`;
        try {
            await writeFile(phrasePath, phrase, { mode: 0o600, flag: 'wx' });
            await chmod(phrasePath, 0o600);
            return await operation(phrasePath);
        } finally {
            await unlink(phrasePath).catch(() => undefined);
        }
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
