import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { chmod, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const MANAGED_BACKUP_TARGET_ID = '8ca41aac-f15c-4eca-a1bd-5d55bf80322c';
export const MANAGED_BACKUP_JOB_ID = 'f3a9d870-146c-4f9e-b078-5bb0d9f20d0c';
export const MANAGED_BACKUP_STAGING_ID = 'b4afdd5b-cc20-4276-a37f-0d86b064ff44';
export const MANAGED_BACKUP_TARGET_NAME = 'Unraid Connect Backup Storage';
export const CONNECT_MANAGED_BACKUP_TARGET_DIR = '/boot/config/unraid/connect/backup/managed-target';
export const CONNECT_LEGACY_FLASH_BACKUP_DIR =
    '/boot/config/plugins/dynamix.my.servers/backup/legacy-flash';
export const CONNECT_MANAGED_BACKUP_SECRET_KEY_PATH = '/boot/config/unraid/secret_key_base';

export type JsonObject = Record<string, unknown>;

export interface ManagedBackupState extends JsonObject {
    schema_version?: 1;
    target_id?: string;
    target_name?: string;
    repository_id?: string;
    repository_url?: string;
    quota_bytes?: number;
    restic_repository_id?: string;
    recovery_key_id?: string;
    recovery_key_added_at?: string;
    pending_recovery_key?: JsonObject;
    setup_complete?: boolean;
    pending_generation?: number;
    pending_repository_id?: string;
    published_generation?: number;
    setup_completed_at?: string;
}

export interface LegacyFlashState extends JsonObject {
    schema_version?: 1;
    job_created_at?: string;
    job_id?: string;
}

export interface ManagedBackupTarget extends JsonObject {
    id: string;
    name: string;
    type: 'rest';
    uri: string;
    password_file: string;
    env: Record<string, string>;
    flags: string[];
    auto_unlock: true;
    auto_init: true;
    prune_policy: null;
    check_policy: null;
    created_at: string;
    updated_at: string;
}

export interface ManagedBackupJob extends JsonObject {
    id: string;
    name: string;
    target_id: string;
    source_type: 'flash';
    source_config: { path: '/boot'; exclude_presets: string[] };
    schedule: string | null;
    enabled: boolean;
    retention: Record<string, number>;
    exclude_patterns: string[];
    flags: string[];
    created_at: string;
    updated_at: string;
    last_run_at: string | null;
    last_run_status: 'success' | 'failed' | 'running' | null;
}

export interface StagedManagedBackup extends JsonObject {
    schema_version: 2;
    provider_module: 'Elixir.ConnectPlugin.ManagedBackupProvider';
    repository_spec: JsonObject;
    generation: number;
    repository_id: string;
    quota_bytes: number;
    target_created: boolean;
    machine_password: string;
    target: ManagedBackupTarget;
    transport_username: string;
    transport_password: string;
}

const recommendedExcludePresets = [
    'system_images',
    'plugin_archives',
    'docker_cache',
    'old_plugins',
    'logs',
    'temp_files',
];

@Injectable()
export class ManagedBackupStore {
    constructor(private readonly config: ConfigService) {}

    get targetDir(): string {
        return (
            this.config.get<string>('CONNECT_MANAGED_BACKUP_TARGET_DIR') ??
            CONNECT_MANAGED_BACKUP_TARGET_DIR
        );
    }

    get legacyFlashDir(): string {
        return (
            this.config.get<string>('CONNECT_MANAGED_BACKUP_LEGACY_FLASH_DIR') ??
            CONNECT_LEGACY_FLASH_BACKUP_DIR
        );
    }

    get passwordPath(): string {
        return join(this.credentialsDir, `${MANAGED_BACKUP_TARGET_ID}.pass`);
    }

    private get credentialsDir(): string {
        return join(this.targetDir, '.credentials');
    }

    private get secretKeyPath(): string {
        return (
            this.config.get<string>('CONNECT_MANAGED_BACKUP_SECRET_KEY_PATH') ??
            CONNECT_MANAGED_BACKUP_SECRET_KEY_PATH
        );
    }

    private credentialPath(id: string): string {
        return join(this.credentialsDir, `${id}.enc`);
    }

    private transportCredentialPath(id: string): string {
        return join(this.credentialsDir, `${id}.transport.enc`);
    }

    async loadState(): Promise<ManagedBackupState> {
        return this.readObject(join(this.targetDir, 'managed-flash.json'), {});
    }

    async saveState(state: ManagedBackupState): Promise<void> {
        await this.writeJson(join(this.targetDir, 'managed-flash.json'), state);
    }

    async loadLegacyFlashState(): Promise<LegacyFlashState> {
        return this.readObject(join(this.legacyFlashDir, 'state.json'), {});
    }

    async saveLegacyFlashState(state: LegacyFlashState): Promise<void> {
        await this.writeJson(join(this.legacyFlashDir, 'state.json'), state);
    }

    async loadOrCreateMachinePassword(): Promise<string> {
        const encrypted = await this.readEncrypted(this.credentialPath(MANAGED_BACKUP_TARGET_ID));
        if (encrypted) {
            await this.writePrivate(this.passwordPath, encrypted);
            return encrypted;
        }

        const passwordFile = await readFile(this.passwordPath, 'utf8').catch(
            (error: NodeJS.ErrnoException) => {
                if (error.code === 'ENOENT') return null;
                throw error;
            }
        );
        const password = passwordFile || randomBytes(32).toString('base64url');
        await this.writeEncrypted(this.credentialPath(MANAGED_BACKUP_TARGET_ID), password);
        await this.writePrivate(this.passwordPath, password);
        return password;
    }

    async buildTarget(
        repositoryUrl: string,
        username: string
    ): Promise<{ target: ManagedBackupTarget; created: boolean }> {
        const targets = await this.readArray(join(this.targetDir, 'targets.json'));
        const existing = targets.find((target) => target.id === MANAGED_BACKUP_TARGET_ID);
        const uri = `rest:${repositoryUrl}`;
        if (existing) {
            if (!isReusableManagedTarget(existing, uri, this.passwordPath)) {
                throw new Error('Managed backup target id is already in use');
            }
            return {
                created: false,
                target: {
                    ...existing,
                    env: { ...existing.env, RESTIC_REST_USERNAME: username },
                    updated_at: new Date().toISOString(),
                },
            };
        }
        const now = new Date().toISOString();
        return {
            created: true,
            target: {
                id: MANAGED_BACKUP_TARGET_ID,
                name: MANAGED_BACKUP_TARGET_NAME,
                type: 'rest',
                uri,
                password_file: this.passwordPath,
                env: { RESTIC_REST_USERNAME: username },
                flags: [],
                auto_unlock: true,
                auto_init: true,
                prune_policy: null,
                check_policy: null,
                created_at: now,
                updated_at: now,
            },
        };
    }

    async saveTargetWithPassword(
        target: ManagedBackupTarget,
        machinePassword: string,
        transportPassword: string
    ): Promise<void> {
        const targetsPath = join(this.targetDir, 'targets.json');
        const targets = await this.readArray(targetsPath);
        const existing = targets.find((candidate) => candidate.id === target.id);
        if (existing && !isReusableManagedTarget(existing, target.uri, target.password_file)) {
            throw new Error('Managed backup target id is already in use');
        }
        await this.writeEncrypted(this.credentialPath(target.id), machinePassword);
        await this.writePrivate(this.passwordPath, machinePassword);
        await this.writeEncrypted(
            this.transportCredentialPath(target.id),
            JSON.stringify({ RESTIC_REST_PASSWORD: transportPassword })
        );
        await this.writeJson(targetsPath, upsert(targets, target));
    }

    async loadManagedTarget(): Promise<{
        target: ManagedBackupTarget;
        machinePassword: string;
        transportPassword: string;
    } | null> {
        const targets = await this.readArray(join(this.targetDir, 'targets.json'));
        const target = targets.find((candidate) => candidate.id === MANAGED_BACKUP_TARGET_ID);
        if (!isManagedTarget(target)) return null;
        const machinePassword = await this.readEncrypted(this.credentialPath(target.id));
        const transportJson = await this.readEncrypted(this.transportCredentialPath(target.id));
        if (!machinePassword || !transportJson) return null;
        const transport: unknown = JSON.parse(transportJson);
        if (!isObject(transport) || typeof transport.RESTIC_REST_PASSWORD !== 'string') return null;
        return { target, machinePassword, transportPassword: transport.RESTIC_REST_PASSWORD };
    }

    async isCoreReady(): Promise<boolean> {
        const state = await this.loadState();
        if (
            state.setup_complete !== true ||
            state.target_id !== MANAGED_BACKUP_TARGET_ID ||
            state.target_name !== MANAGED_BACKUP_TARGET_NAME ||
            typeof state.repository_id !== 'string' ||
            !state.repository_id ||
            typeof state.repository_url !== 'string' ||
            !state.repository_url ||
            typeof state.restic_repository_id !== 'string' ||
            !state.restic_repository_id ||
            typeof state.recovery_key_id !== 'string' ||
            !state.recovery_key_id
        ) {
            return false;
        }
        const loaded = await this.loadManagedTarget();
        return Boolean(
            loaded &&
                loaded.target.name === MANAGED_BACKUP_TARGET_NAME &&
                loaded.target.uri === `rest:${state.repository_url}` &&
                loaded.target.auto_init === true &&
                loaded.target.auto_unlock === true &&
                loaded.machinePassword &&
                loaded.transportPassword
        );
    }

    async saveStaging(staged: StagedManagedBackup): Promise<void> {
        await this.writeEncrypted(
            this.credentialPath(MANAGED_BACKUP_STAGING_ID),
            JSON.stringify(staged)
        );
    }

    async loadStaging(): Promise<StagedManagedBackup | null> {
        const payload = await this.readEncrypted(this.credentialPath(MANAGED_BACKUP_STAGING_ID));
        if (!payload) return null;
        const value: unknown = JSON.parse(payload);
        return isStagedManagedBackup(value) ? value : null;
    }

    async deleteStaging(): Promise<void> {
        await unlink(this.credentialPath(MANAGED_BACKUP_STAGING_ID)).catch(
            (error: NodeJS.ErrnoException) => {
                if (error.code !== 'ENOENT') throw error;
            }
        );
    }

    async ensureInitialJob(): Promise<ManagedBackupJob> {
        const state = await this.loadLegacyFlashState();
        const jobsPath = join(this.legacyFlashDir, 'jobs.json');
        const jobs = await this.readArray(jobsPath);
        const existing = findManagedFlashJob(jobs, state.job_id);
        let job = existing;

        if (!job) {
            const now = new Date().toISOString();
            const id = jobs.some((candidate) => candidate.id === MANAGED_BACKUP_JOB_ID)
                ? randomUUID()
                : MANAGED_BACKUP_JOB_ID;
            job = {
                id,
                name: 'Flash Backup',
                target_id: MANAGED_BACKUP_TARGET_ID,
                source_type: 'flash',
                source_config: { path: '/boot', exclude_presets: recommendedExcludePresets },
                schedule: '0 3 * * *',
                enabled: true,
                retention: { keep_last: 7, keep_daily: 7, keep_weekly: 4, keep_monthly: 6 },
                exclude_patterns: [],
                flags: [],
                created_at: now,
                updated_at: now,
                last_run_at: null,
                last_run_status: null,
            };
            await this.writeJson(jobsPath, [...jobs, job]);
        }
        await this.saveLegacyFlashState({
            schema_version: 1,
            job_created_at: state.job_created_at ?? new Date().toISOString(),
            job_id: job.id,
        });
        return job;
    }

    async loadInitialJob(): Promise<ManagedBackupJob | null> {
        const state = await this.loadLegacyFlashState();
        const jobs = await this.readArray(join(this.legacyFlashDir, 'jobs.json'));
        return findManagedFlashJob(jobs, state.job_id);
    }

    async recordJobRun(status: 'success' | 'failed' | 'running'): Promise<void> {
        const path = join(this.legacyFlashDir, 'jobs.json');
        const jobs = await this.readArray(path);
        const state = await this.loadLegacyFlashState();
        const job = findManagedFlashJob(jobs, state.job_id);
        const index = job ? jobs.findIndex((candidate) => candidate.id === job.id) : -1;
        if (index < 0) return;
        const now = new Date().toISOString();
        jobs[index] = { ...jobs[index], last_run_at: now, last_run_status: status, updated_at: now };
        await this.writeJson(path, jobs);
    }

    private async ensureDirectories(): Promise<void> {
        await mkdir(this.credentialsDir, { recursive: true, mode: 0o700 });
        await chmod(this.credentialsDir, 0o700);
    }

    private async encryptionKey(): Promise<Buffer> {
        let secret = await readFile(this.secretKeyPath, 'utf8').catch((error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') return null;
            throw error;
        });
        if (!secret?.trim()) {
            secret = randomBytes(64).toString('base64').replace(/=+$/, '');
            await this.writePrivate(this.secretKeyPath, secret);
        }
        return createHash('sha256').update(secret.trim()).digest();
    }

    private async writeEncrypted(path: string, plaintext: string): Promise<void> {
        const ivText = randomBytes(16).toString('base64').slice(0, 16);
        const cipher = createCipheriv('aes-256-cbc', await this.encryptionKey(), ivText);
        const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
        await this.writePrivate(path, `${ivText}:${ciphertext.toString('base64')}`);
    }

    private async readEncrypted(path: string): Promise<string | null> {
        const content = await readFile(path, 'utf8').catch((error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') return null;
            throw error;
        });
        if (content === null) return null;
        const separator = content.indexOf(':');
        if (separator !== 16) throw new Error('Managed backup credentials are invalid');
        try {
            const decipher = createDecipheriv(
                'aes-256-cbc',
                await this.encryptionKey(),
                content.slice(0, separator)
            );
            return Buffer.concat([
                decipher.update(content.slice(separator + 1), 'base64'),
                decipher.final(),
            ]).toString('utf8');
        } catch {
            throw new Error('Managed backup credentials are unreadable');
        }
    }

    private async readArray(path: string): Promise<JsonObject[]> {
        const value = await this.readJson(path, []);
        if (!Array.isArray(value) || !value.every(isObject)) {
            throw new Error('Backup configuration is invalid');
        }
        return value;
    }

    private async readObject<T extends JsonObject>(path: string, fallback: T): Promise<T> {
        const value = await this.readJson(path, fallback);
        if (!isObject(value)) throw new Error('Backup configuration is invalid');
        return value as T;
    }

    private async readJson(path: string, fallback: unknown): Promise<unknown> {
        const content = await readFile(path, 'utf8').catch((error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') return null;
            throw error;
        });
        if (content === null) return fallback;
        try {
            return JSON.parse(content) as unknown;
        } catch {
            throw new Error('Backup configuration is invalid');
        }
    }

    private async writeJson(path: string, value: unknown): Promise<void> {
        await this.writePrivate(path, JSON.stringify(value, null, 2));
    }

    private async writePrivate(path: string, content: string): Promise<void> {
        await mkdir(dirname(path), { recursive: true });
        if (dirname(path) === this.credentialsDir) await this.ensureDirectories();
        const temporary = `${path}.${randomUUID()}.tmp`;
        try {
            await writeFile(temporary, content, { mode: 0o600, flag: 'wx' });
            await rename(temporary, path);
            await chmod(path, 0o600);
        } finally {
            await unlink(temporary).catch(() => undefined);
        }
    }
}

function isObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function upsert(values: JsonObject[], value: JsonObject): JsonObject[] {
    const index = values.findIndex((candidate) => candidate.id === value.id);
    if (index < 0) return [...values, value];
    const updated = [...values];
    updated[index] = value;
    return updated;
}

function isManagedTarget(value: unknown): value is ManagedBackupTarget {
    return (
        isObject(value) &&
        value.id === MANAGED_BACKUP_TARGET_ID &&
        value.type === 'rest' &&
        typeof value.uri === 'string' &&
        typeof value.password_file === 'string' &&
        isObject(value.env) &&
        typeof value.env.RESTIC_REST_USERNAME === 'string'
    );
}

function isReusableManagedTarget(
    value: unknown,
    uri: string,
    passwordPath: string
): value is ManagedBackupTarget {
    return (
        isManagedTarget(value) &&
        value.name === MANAGED_BACKUP_TARGET_NAME &&
        value.uri === uri &&
        value.password_file === passwordPath &&
        value.auto_init === true &&
        value.auto_unlock === true
    );
}

function isManagedBackupJob(value: unknown): value is ManagedBackupJob {
    return (
        isObject(value) &&
        typeof value.id === 'string' &&
        value.id.length > 0 &&
        value.target_id === MANAGED_BACKUP_TARGET_ID &&
        value.source_type === 'flash' &&
        isObject(value.source_config) &&
        value.source_config.path === '/boot' &&
        typeof value.enabled === 'boolean'
    );
}

function findManagedFlashJob(
    jobs: JsonObject[],
    recordedId: string | undefined
): ManagedBackupJob | null {
    const preferredIds = [recordedId, MANAGED_BACKUP_JOB_ID].filter(
        (id): id is string => typeof id === 'string' && id.length > 0
    );
    for (const id of preferredIds) {
        const candidate = jobs.find((job) => job.id === id);
        if (isManagedBackupJob(candidate)) return candidate;
    }
    const compatible = jobs.filter(isManagedBackupJob);
    return compatible.length === 1 ? compatible[0] : null;
}

function isStagedManagedBackup(value: unknown): value is StagedManagedBackup {
    return (
        isObject(value) &&
        value.schema_version === 2 &&
        value.provider_module === 'Elixir.ConnectPlugin.ManagedBackupProvider' &&
        isObject(value.repository_spec) &&
        Number.isSafeInteger(value.generation) &&
        Number(value.generation) > 0 &&
        typeof value.repository_id === 'string' &&
        Number.isSafeInteger(value.quota_bytes) &&
        Number(value.quota_bytes) > 0 &&
        typeof value.target_created === 'boolean' &&
        typeof value.machine_password === 'string' &&
        isManagedTarget(value.target) &&
        typeof value.transport_username === 'string' &&
        typeof value.transport_password === 'string'
    );
}
