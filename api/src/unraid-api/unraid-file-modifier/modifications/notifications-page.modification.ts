import type { Logger } from '@nestjs/common';
import { readFile, writeFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.service';
import { backupFile, restoreFile } from '@app/utils';

export default class NotificationsPageModification implements FileModification {
    id: string = 'Notifications.page';
    logger: Logger;
    filePath: string = '/usr/local/emhttp/plugins/dynamix/Notifications.page';
    constructor(logger: Logger) {
        this.logger = logger;
    }

    async apply(): Promise<void> {
        await backupFile(this.filePath, true);
        const fileContent = await readFile(this.filePath, 'utf-8');
        await writeFile(this.filePath, NotificationsPageModification.applyToSource(fileContent));
        this.logger.log(`${this.id} replaced successfully.`);
    }

    async rollback(): Promise<void> {
        const restored = await restoreFile(this.filePath, false);
        if (restored) {
            this.logger.debug(`${this.id} restored.`);
        } else {
            this.logger.warn(`Could not restore ${this.id}`);
        }
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        return {
            shouldApply: true,
            reason: 'Always apply the allowed file changes to ensure compatibility.',
        };
    }

    static applyToSource(fileContent: string): string {
        return (
            fileContent
                // Remove lines between _(Date format)_: and :notifications_date_format_help:
                .replace(/^\s*_\(Date format\)_:(?:[^\n]*\n)*?\s*:notifications_date_format_help:/gm, '')

                // Remove lines between _(Time format)_: and :notifications_time_format_help:
                .replace(/^\s*_\(Time format\)_:(?:[^\n]*\n)*?\s*:notifications_time_format_help:/gm, '')
        );
    }
}
