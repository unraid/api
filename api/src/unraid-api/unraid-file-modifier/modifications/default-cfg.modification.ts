import { readFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class DefaultCfgModification extends FileModification {
    id: string = 'default-cfg';
    public readonly filePath: string = '/usr/local/emhttp/plugins/dynamix/default.cfg';

    async shouldApply(): Promise<ShouldApplyWithReason> {
        // Skip for 7.4+
        if (await this.isUnraidVersionGreaterThanOrEqualTo('7.4.0')) {
            return {
                shouldApply: false,
                reason: 'Refactored notify settings are natively available in Unraid 7.4+',
            };
        }
        return super.shouldApply({ checkOsVersion: false });
    }

    protected async generatePatch(overridePath?: string): Promise<string> {
        const fileContent = await readFile(this.filePath, 'utf-8');
        let newContent = fileContent;

        // Target: [notify] section
        // We want to insert:
        // expand="true"
        // duration="5000"
        // max="3"
        //
        // Inserting after [notify] line seems safest.

        const notifySectionHeader = '[notify]';
        const settingsToInsert = `expand="true"
duration="5000"
max="3"`;

        if (newContent.includes(notifySectionHeader)) {
            // Check if already present to avoid duplicates (idempotency)
            // Using a simple check for 'expand="true"' might be enough, or rigorous regex
            if (!newContent.includes('expand="true"')) {
                newContent = newContent.replace(
                    notifySectionHeader,
                    notifySectionHeader + '\n' + settingsToInsert
                );
            }
        } else {
            // If [notify] missing, append it?
            // Unlikely for default.cfg, but let's append at end if missing
            newContent += `\n${notifySectionHeader}\n${settingsToInsert}\n`;
        }

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }
}
