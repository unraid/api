import type { Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';

import { createPatch } from 'diff';

import {
    FileModification,
    PatchResult,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification';

export default class NotificationsPageModification extends FileModification {
    id: string = 'Notifications.page';
    private readonly filePath: string = '/usr/local/emhttp/plugins/dynamix/Notifications.page';

    constructor(logger: Logger) {
        super(logger);
    }

    protected async generatePatch(): Promise<PatchResult> {
        const fileContent = await readFile(this.filePath, 'utf-8');

        const newContent = NotificationsPageModification.applyToSource(fileContent);

        const patch = createPatch(this.filePath, fileContent, newContent, undefined, undefined, {
            context: 3,
        });

        return {
            targetFile: this.filePath,
            patch,
        };
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        return {
            shouldApply: true,
            reason: 'Always apply the allowed file changes to ensure compatibility.',
        };
    }

    private static applyToSource(fileContent: string): string {
        return (
            fileContent
                // Remove lines between _(Date format)_: and :notifications_date_format_help:
                .replace(/^\s*_\(Date format\)_:(?:[^\n]*\n)*?\s*:notifications_date_format_help:/gm, '')
                // Remove lines between _(Time format)_: and :notifications_time_format_help:
                .replace(/^\s*_\(Time format\)_:(?:[^\n]*\n)*?\s*:notifications_time_format_help:/gm, '')
        );
    }
}
