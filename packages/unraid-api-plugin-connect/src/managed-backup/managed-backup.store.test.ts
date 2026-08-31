import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
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
    let store: ManagedBackupStore;

    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'managed-backup-store-'));
        backupDir = join(directory, 'backup');
        store = new ManagedBackupStore(
            new ConfigService({
                CONNECT_MANAGED_BACKUP_CONFIG_DIR: backupDir,
                CONNECT_MANAGED_BACKUP_SECRET_KEY_PATH: join(directory, 'secret_key_base'),
            })
        );
    });

    afterEach(async () => {
        await rm(directory, { recursive: true, force: true });
    });

    it('writes the exact target, credential, and job locations consumed by Core', async () => {
        const password = await store.loadOrCreateMachinePassword();
        const { target } = await store.buildTarget(
            'https://backup.example/backup/v1/repository/server/',
            'transport-user'
        );
        await store.saveTargetWithPassword(target, password, 'transport-secret');
        await store.ensureInitialJob();

        const targets = JSON.parse(await readFile(join(backupDir, 'targets.json'), 'utf8'));
        expect(targets).toEqual([
            expect.objectContaining({
                id: MANAGED_BACKUP_TARGET_ID,
                type: 'rest',
                uri: 'rest:https://backup.example/backup/v1/repository/server/',
                password_file: join(
                    backupDir,
                    '.credentials',
                    `${MANAGED_BACKUP_TARGET_ID}.pass`
                ),
                env: { RESTIC_REST_USERNAME: 'transport-user' },
                auto_init: true,
                auto_unlock: true,
            }),
        ]);
        expect(JSON.stringify(targets)).not.toContain('transport-secret');

        const jobs = JSON.parse(await readFile(join(backupDir, 'jobs.json'), 'utf8'));
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
            (await stat(join(backupDir, '.credentials', `${MANAGED_BACKUP_TARGET_ID}.enc`))).mode &
                0o777
        ).toBe(0o600);
        await expect(store.loadManagedTarget()).resolves.toMatchObject({
            machinePassword: password,
            transportPassword: 'transport-secret',
        });
    });

    it('does not recreate the ordinary flash job after the user removes it', async () => {
        await store.ensureInitialJob();
        await writeFile(join(backupDir, 'jobs.json'), '[]');
        await store.ensureInitialJob();
        expect(JSON.parse(await readFile(join(backupDir, 'jobs.json'), 'utf8'))).toEqual([]);
    });

    it('preserves unrelated Core targets and jobs', async () => {
        await store.loadOrCreateMachinePassword();
        await writeFile(
            join(backupDir, 'targets.json'),
            JSON.stringify([{ id: 'user-target', name: 'NAS target' }])
        );
        await writeFile(
            join(backupDir, 'jobs.json'),
            JSON.stringify([{ id: 'user-job', name: 'Appdata' }])
        );
        const { target } = await store.buildTarget('https://backup.example/repo/', 'user');
        await store.saveTargetWithPassword(target, 'machine', 'transport');
        await store.ensureInitialJob();
        expect(JSON.parse(await readFile(join(backupDir, 'targets.json'), 'utf8'))[0]).toEqual({
            id: 'user-target',
            name: 'NAS target',
        });
        expect(JSON.parse(await readFile(join(backupDir, 'jobs.json'), 'utf8'))[0]).toEqual({
            id: 'user-job',
            name: 'Appdata',
        });
    });
});
