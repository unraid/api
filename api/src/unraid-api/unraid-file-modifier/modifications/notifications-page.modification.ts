import { readFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class NotificationsPageModification extends FileModification {
    id: string = 'notifications-page';
    public readonly filePath: string = '/usr/local/emhttp/plugins/dynamix/Notifications.page';

    protected async generatePatch(overridePath?: string): Promise<string> {
        const fileContent = await readFile(this.filePath, 'utf-8');

        const newContent = NotificationsPageModification.applyToSource(fileContent);

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        if (await this.isUnraidVersionGreaterThanOrEqualTo('7.2.0')) {
            return {
                shouldApply: false,
                reason: 'Skipping for Unraid 7.2 or later, where the Unraid API is integrated.',
            };
        }
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
