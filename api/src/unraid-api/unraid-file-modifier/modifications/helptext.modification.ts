import { readFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class HelptextModification extends FileModification {
    id: string = 'helptext';
    public readonly filePath: string = '/usr/local/emhttp/languages/en_US/helptext.txt';

    async shouldApply(): Promise<ShouldApplyWithReason> {
        // Skip for 7.4+
        if (await this.isUnraidVersionGreaterThanOrEqualTo('7.4.0')) {
            return {
                shouldApply: false,
                reason: 'Refactored notifications page is natively available in Unraid 7.4+',
            };
        }
        return super.shouldApply({ checkOsVersion: false });
    }

    protected async generatePatch(overridePath?: string): Promise<string> {
        const fileContent = await readFile(this.filePath, 'utf-8');

        // We want to append to the existing help block for notifications
        // The block usually ends with :end

        // Target: :notifications_display_position_help: ... :end
        // We match until the next :end that follows :notifications_display_position_help:

        let newContent = fileContent;
        const targetStart = ':notifications_display_position_help:';
        const targetEnd = ':end';

        const newHelpText = `
:notifications_display_position_help:
Choose the position of where notification popups appear on screen.
:end

:notifications_stack_help:
When enabled, multiple notifications are stacked to conserve screen space.
:end

:notifications_duration_help:
Time in milliseconds before a notification automatically closes.
:end

:notifications_max_help:
Maximum number of notifications shown on screen at once.
:end`;

        if (newContent.includes(targetStart) && !newContent.includes(':notifications_stack_help:')) {
            // Find the position of :notifications_display_position_help:
            const startIndex = newContent.indexOf(targetStart);
            // Find the next :end after that
            const endIndex = newContent.indexOf(targetEnd, startIndex);

            if (endIndex !== -1) {
                const effectiveEndIndex = endIndex + targetEnd.length;
                newContent =
                    newContent.substring(0, startIndex) +
                    newHelpText +
                    newContent.substring(effectiveEndIndex);
            }
        }

        if (!(await this.isUnraidVersionGreaterThanOrEqualTo('7.1.0'))) {
            // Remove :notifications_auto_close_help: block
            // Looks like:
            // :notifications_auto_close_help:
            // ...
            // :end

            newContent = newContent.replace(/:notifications_auto_close_help:[\s\S]*?:end\s*/gm, '');
        }

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }
}
