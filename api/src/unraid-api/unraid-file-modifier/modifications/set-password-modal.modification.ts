import { readFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

// Renamed class to accurately reflect its purpose and target file
export default class SetPasswordModalModification extends FileModification {
    id: string = 'set-password-modal'; // Updated ID
    public readonly filePath: string = '/usr/local/emhttp/plugins/dynamix/include/.set-password.php';

    protected async generatePatch(overridePath?: string): Promise<string> {
        const fileContent = await readFile(this.filePath, 'utf-8');

        const newContent = SetPasswordModalModification.applyToSource(fileContent);

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        if (await this.isUnraidVersionGreaterThanOrEqualTo('7.2.0')) {
            return {
                shouldApply: false,
                reason: 'Skipping for Unraid 7.2 or later, where the Unraid API is integrated.',
            };
        }
        const fileContent = await readFile(this.filePath, 'utf-8');
        const injectString =
            '<?include "$docroot/plugins/dynamix.my.servers/include/welcome-modal.php"?>';
        // Apply only if the string isn't already present
        if (fileContent.includes(injectString)) {
            return {
                shouldApply: false,
                reason: 'Welcome modal include already exists.',
            };
        }
        return {
            shouldApply: true,
            reason: 'Inject welcome modal include.',
        };
    }

    private static applyToSource(fileContent: string): string {
        const injectString =
            '<?include "$docroot/plugins/dynamix.my.servers/include/welcome-modal.php"?>';
        const bodyEndTag = '</body>';

        // Check if the body tag exists and the inject string is not already there
        if (fileContent.includes(bodyEndTag) && !fileContent.includes(injectString)) {
            // Inject the string right before the closing body tag
            return fileContent.replace(bodyEndTag, `${injectString}\n${bodyEndTag}`);
        }

        // Return original content if conditions aren't met (e.g., no body tag, already injected)
        return fileContent;
    }
}
