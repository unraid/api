import { ConfigService } from '@nestjs/config';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
    MANAGED_BACKUP_JOB_ID,
    MANAGED_BACKUP_TARGET_ID,
    ManagedBackupStore,
} from './managed-backup.store.js';

describe('Core-compatible managed backup store', () => {
    let directory: string;
    let backupDir: string;
    let targetDir: string;
    let legacyFlashDir: string;
    let store: ManagedBackupStore;

    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'managed-backup-store-'));
        backupDir = join(directory, 'backup');
        targetDir = join(backupDir, 'managed-target');
        legacyFlashDir = join(backupDir, 'legacy-flash');
        store = new ManagedBackupStore(
            new ConfigService({
                CONNECT_MANAGED_BACKUP_TARGET_DIR: targetDir,
                CONNECT_MANAGED_BACKUP_LEGACY_FLASH_DIR: legacyFlashDir,
                CONNECT_MANAGED_BACKUP_SECRET_KEY_PATH: join(directory, 'secret_key_base'),
            })
        );
    });

    afterEach(async () => {
        await rm(directory, { recursive: true, force: true });
    });

    it('separates the Connect target from the legacy Flash Backup job', async () => {
        const password = await store.loadOrCreateMachinePassword();
        const { target } = await store.buildTarget(
            'https://backup.example/backup/v1/repository/server/',
            'transport-user'
        );
        await store.saveTargetWithPassword(target, password, 'transport-secret');
        await store.ensureInitialJob();

        const targets = JSON.parse(await readFile(join(targetDir, 'targets.json'), 'utf8'));
        expect(targets).toEqual([
            expect.objectContaining({
                id: MANAGED_BACKUP_TARGET_ID,
                type: 'rest',
                uri: 'rest:https://backup.example/backup/v1/repository/server/',
                password_file: join(targetDir, '.credentials', `${MANAGED_BACKUP_TARGET_ID}.pass`),
                env: { RESTIC_REST_USERNAME: 'transport-user' },
                auto_init: true,
                auto_unlock: true,
            }),
        ]);
        expect(JSON.stringify(targets)).not.toContain('transport-secret');

        const jobs = JSON.parse(await readFile(join(legacyFlashDir, 'jobs.json'), 'utf8'));
        expect(jobs).toEqual([
            expect.objectContaining({
                id: MANAGED_BACKUP_JOB_ID,
                target_id: MANAGED_BACKUP_TARGET_ID,
                source_type: 'flash',
                source_config: {
                    path: '/boot',
                    exclude_presets: [
                        'system_images',
                        'plugin_archives',
                        'docker_cache',
                        'old_plugins',
                        'logs',
                        'temp_files',
                    ],
                },
                schedule: '0 3 * * *',
                retention: { keep_last: 7, keep_daily: 7, keep_weekly: 4, keep_monthly: 6 },
            }),
        ]);

        expect((await stat(join(directory, 'secret_key_base'))).mode & 0o777).toBe(0o600);
        expect(
            (await stat(join(targetDir, '.credentials', `${MANAGED_BACKUP_TARGET_ID}.enc`))).mode & 0o777
        ).toBe(0o600);
        await expect(store.loadManagedTarget()).resolves.toMatchObject({
            machinePassword: password,
            transportPassword: 'transport-secret',
        });
    });

    it('reports a removed flash job as absent and recreates it only on explicit initialization', async () => {
        await store.ensureInitialJob();
        await writeFile(join(legacyFlashDir, 'jobs.json'), '[]');
        await expect(store.loadInitialJob()).resolves.toBeNull();

        const initialized = await store.ensureInitialJob();

        expect(initialized).toMatchObject({ source_type: 'flash', source_config: { path: '/boot' } });
        expect(JSON.parse(await readFile(join(legacyFlashDir, 'jobs.json'), 'utf8'))).toHaveLength(1);
    });

    it('preserves unrelated entries in each Connect-owned store', async () => {
        await store.loadOrCreateMachinePassword();
        await mkdir(legacyFlashDir, { recursive: true });
        await writeFile(
            join(targetDir, 'targets.json'),
            JSON.stringify([{ id: 'user-target', name: 'NAS target' }])
        );
        await writeFile(
            join(legacyFlashDir, 'jobs.json'),
            JSON.stringify([{ id: 'user-job', name: 'Appdata' }])
        );
        const { target } = await store.buildTarget('https://backup.example/repo/', 'user');
        await store.saveTargetWithPassword(target, 'machine', 'transport');
        await store.ensureInitialJob();
        expect(JSON.parse(await readFile(join(targetDir, 'targets.json'), 'utf8'))[0]).toEqual({
            id: 'user-target',
            name: 'NAS target',
        });
        expect(JSON.parse(await readFile(join(legacyFlashDir, 'jobs.json'), 'utf8'))[0]).toEqual({
            id: 'user-job',
            name: 'Appdata',
        });
    });

    it('refuses to overwrite an incompatible target that uses the managed target id', async () => {
        await mkdir(targetDir, { recursive: true });
        const existing = {
            id: MANAGED_BACKUP_TARGET_ID,
            name: 'User S3 target',
            type: 's3',
            uri: 's3:s3.example/bucket',
        };
        await writeFile(join(targetDir, 'targets.json'), JSON.stringify([existing]));

        await expect(
            store.buildTarget('https://backup.example/repo/', 'transport-user')
        ).rejects.toThrow('already in use');
        expect(JSON.parse(await readFile(join(targetDir, 'targets.json'), 'utf8'))).toEqual([existing]);
    });

    it('refreshes transport identity without replacing a compatible managed target', async () => {
        const first = await store.buildTarget('https://backup.example/repo/', 'transport-user-one');
        await store.saveTargetWithPassword(first.target, 'machine', 'transport-one');

        const refreshed = await store.buildTarget('https://backup.example/repo/', 'transport-user-two');

        expect(refreshed.created).toBe(false);
        expect(refreshed.target).toMatchObject({
            id: MANAGED_BACKUP_TARGET_ID,
            uri: 'rest:https://backup.example/repo/',
            env: { RESTIC_REST_USERNAME: 'transport-user-two' },
        });
    });

    it('preserves a target and credentials claimed after setup was staged', async () => {
        const staged = await store.buildTarget('https://backup.example/repo/', 'staged-user');
        await store.saveTargetWithPassword(staged.target, 'original-machine', 'original-transport');
        const machinePath = join(targetDir, '.credentials', `${MANAGED_BACKUP_TARGET_ID}.enc`);
        const transportPath = join(
            targetDir,
            '.credentials',
            `${MANAGED_BACKUP_TARGET_ID}.transport.enc`
        );
        const originalMachine = await readFile(machinePath);
        const originalTransport = await readFile(transportPath);
        const claimed = {
            id: MANAGED_BACKUP_TARGET_ID,
            name: 'User target',
            type: 's3',
            uri: 's3:s3.example/user-bucket',
        };
        await writeFile(join(targetDir, 'targets.json'), JSON.stringify([claimed]));

        await expect(
            store.saveTargetWithPassword(staged.target, 'staged-machine', 'staged-transport')
        ).rejects.toThrow('already in use');

        expect(JSON.parse(await readFile(join(targetDir, 'targets.json'), 'utf8'))).toEqual([claimed]);
        expect(await readFile(machinePath)).toEqual(originalMachine);
        expect(await readFile(transportPath)).toEqual(originalTransport);
    });

    it('does not overwrite an incompatible job that uses the preferred flash job id', async () => {
        await mkdir(legacyFlashDir, { recursive: true });
        await writeFile(
            join(legacyFlashDir, 'jobs.json'),
            JSON.stringify([
                { id: MANAGED_BACKUP_JOB_ID, name: 'Appdata', source_type: 'shares' },
                { id: 'u8-job', name: 'VM backup', source_type: 'virtual_machines' },
            ])
        );

        await expect(store.loadInitialJob()).resolves.toBeNull();
        const initialized = await store.ensureInitialJob();
        const jobs = JSON.parse(await readFile(join(legacyFlashDir, 'jobs.json'), 'utf8'));

        expect(initialized.id).not.toBe(MANAGED_BACKUP_JOB_ID);
        expect(jobs).toHaveLength(3);
        expect(jobs[0]).toEqual({
            id: MANAGED_BACKUP_JOB_ID,
            name: 'Appdata',
            source_type: 'shares',
        });
        expect(jobs[1]).toEqual({ id: 'u8-job', name: 'VM backup', source_type: 'virtual_machines' });
        expect(await store.loadLegacyFlashState()).toMatchObject({ job_id: initialized.id });
        await expect(store.loadInitialJob()).resolves.toMatchObject({ id: initialized.id });
    });

    it('adopts one compatible UUID flash job without duplicating U8 jobs', async () => {
        await mkdir(legacyFlashDir, { recursive: true });
        const existingFlashId = '705372c2-c8ee-4199-8512-18dfa322617e';
        const existingJobs = [
            {
                id: 'u8-job',
                name: 'Appdata',
                target_id: 'u8-target',
                source_type: 'path',
                source_config: { path: '/mnt/user/appdata' },
                enabled: true,
            },
            {
                id: existingFlashId,
                name: 'Flash Backup',
                target_id: MANAGED_BACKUP_TARGET_ID,
                source_type: 'flash',
                source_config: { path: '/boot' },
                enabled: true,
            },
        ];
        await writeFile(join(legacyFlashDir, 'jobs.json'), JSON.stringify(existingJobs));

        const initialized = await store.ensureInitialJob();

        expect(initialized.id).toBe(existingFlashId);
        expect(JSON.parse(await readFile(join(legacyFlashDir, 'jobs.json'), 'utf8'))).toEqual(
            existingJobs
        );
        expect(await store.loadLegacyFlashState()).toMatchObject({ job_id: existingFlashId });
    });

    it('treats a job with the preferred id but the wrong source shape as uninitialized', async () => {
        await mkdir(legacyFlashDir, { recursive: true });
        await writeFile(
            join(legacyFlashDir, 'jobs.json'),
            JSON.stringify([
                {
                    id: MANAGED_BACKUP_JOB_ID,
                    name: 'Flash-ish',
                    target_id: MANAGED_BACKUP_TARGET_ID,
                    source_type: 'flash',
                    source_config: { path: '/mnt/user/flash-copy' },
                    enabled: true,
                },
            ])
        );

        await expect(store.loadInitialJob()).resolves.toBeNull();
    });

    it('does not treat setup_complete alone as a Core-ready backup', async () => {
        await store.saveState({ setup_complete: true });

        await expect(store.isCoreReady()).resolves.toBe(false);
    });
});
