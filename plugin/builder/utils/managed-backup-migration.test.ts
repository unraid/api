import { execFile } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const helper = resolve(
    import.meta.dirname,
    '../../source/dynamix.unraid.net/usr/local/share/dynamix.unraid.net/scripts/managed_backup.sh'
);
const targetId = '8ca41aac-f15c-4eca-a1bd-5d55bf80322c';

describe('legacy Flash Backup migration lifecycle', () => {
    let directory: string;
    let backupDir: string;
    let pluginDir: string;
    let legacyState: string;
    let notifyCommand: string;
    let notifyLog: string;

    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'managed-backup-migration-'));
        backupDir = join(directory, 'backup');
        pluginDir = join(directory, 'plugin');
        legacyState = join(directory, 'flashbackup.ini');
        notifyCommand = join(directory, 'notify');
        notifyLog = join(directory, 'notify.log');
        await mkdir(backupDir, { recursive: true });
        await writeFile(
            notifyCommand,
            '#!/bin/sh\nprintf "%s\\n" "$*" >> "$CONNECT_NOTIFY_LOG"\n'
        );
        await chmod(notifyCommand, 0o755);
    });

    afterEach(async () => {
        await rm(directory, { recursive: true, force: true });
    });

    it('notifies an active legacy user once while preserving the migration marker', async () => {
        await writeFile(legacyState, 'activated=yes\n');

        await runHelper('notify_legacy_flash_backup_migration');
        await runHelper('notify_legacy_flash_backup_migration');

        await expect(
            readFile(join(pluginDir, 'managed-backup-migration-pending'), 'utf8')
        ).resolves.toBe('');
        await expect(
            readFile(join(pluginDir, 'managed-backup-migration-notified'), 'utf8')
        ).resolves.toBe('');
        const notifications = (await readFile(notifyLog, 'utf8')).trim().split('\n');
        expect(notifications).toHaveLength(1);
        expect(notifications[0]).toContain('Set up encrypted Flash Backup');
        expect(notifications[0]).toContain('/Settings/ManagementAccess/Connect');
    });

    it('does not mark an incomplete state as Core-ready', async () => {
        await writeFile(legacyState, 'activated=yes\n');
        await writeFile(join(backupDir, 'managed-flash.json'), '{"setup_complete":true}');

        await expect(runHelper('managed_backup_is_ready')).rejects.toThrow();
        await runHelper('notify_legacy_flash_backup_migration');

        await expect(
            readFile(join(pluginDir, 'managed-backup-migration-pending'), 'utf8')
        ).resolves.toBe('');
    });

    it('retries notification after the notification command fails', async () => {
        await writeFile(legacyState, 'activated=yes\n');
        await writeFile(
            notifyCommand,
            '#!/bin/sh\nprintf "%s\\n" "$*" >> "$CONNECT_NOTIFY_LOG"\nexit 1\n'
        );
        await chmod(notifyCommand, 0o755);

        await runHelper('notify_legacy_flash_backup_migration');
        await runHelper('notify_legacy_flash_backup_migration');

        const notifications = (await readFile(notifyLog, 'utf8')).trim().split('\n');
        expect(notifications).toHaveLength(2);
        await expect(
            readFile(join(pluginDir, 'managed-backup-migration-notified'))
        ).rejects.toThrow();
    });

    it('recognizes the canonical Core state and keeps retirement retryable', async () => {
        await writeFile(legacyState, 'activated=yes\n');
        await writeCoreReadyState();

        await runHelper('managed_backup_is_ready');
        await runHelper('notify_legacy_flash_backup_migration');

        await expect(
            readFile(join(pluginDir, 'managed-backup-migration-pending'), 'utf8')
        ).resolves.toBe('');
        await expect(readFile(notifyLog, 'utf8')).rejects.toThrow();
    });

    async function runHelper(command: string) {
        return execFileAsync('/bin/sh', ['-c', '. "$1"; "$2"', 'managed-backup-test', helper, command], {
            env: {
                ...process.env,
                CONNECT_MANAGED_BACKUP_CONFIG_DIR: backupDir,
                CONNECT_PLUGIN_CONFIG_DIR: pluginDir,
                CONNECT_BOOT_DIR: directory,
                CONNECT_LEGACY_FLASH_BACKUP_STATE: legacyState,
                CONNECT_NOTIFY_COMMAND: notifyCommand,
                CONNECT_NOTIFY_LOG: notifyLog,
            },
        });
    }

    async function writeCoreReadyState() {
        const repositoryUrl = 'https://backup.example/repository/server/';
        await writeFile(
            join(backupDir, 'managed-flash.json'),
            JSON.stringify({
                schema_version: 1,
                setup_complete: true,
                target_id: targetId,
                target_name: 'Unraid Connect Backup Storage',
                repository_id: 'repository-1',
                repository_url: repositoryUrl,
                restic_repository_id: 'restic-repository-1',
                recovery_key_id: 'recovery-key-1',
            })
        );
        await writeFile(
            join(backupDir, 'targets.json'),
            JSON.stringify([
                {
                    id: targetId,
                    name: 'Unraid Connect Backup Storage',
                    type: 'rest',
                    uri: `rest:${repositoryUrl}`,
                    auto_init: true,
                    auto_unlock: true,
                },
            ])
        );
        const credentialsDir = join(backupDir, '.credentials');
        await mkdir(credentialsDir, { recursive: true });
        await Promise.all(
            ['pass', 'enc', 'transport.enc'].map((suffix) =>
                writeFile(join(credentialsDir, `${targetId}.${suffix}`), 'credential')
            )
        );
    }
});
