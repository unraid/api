import { readFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class DefaultGrayCssModification extends FileModification {
    id = 'default-gray-css-modification';
    public readonly filePath = '/usr/local/emhttp/plugins/dynamix/styles/default-gray.css';

    async shouldApply({
        checkOsVersion = true,
    }: { checkOsVersion?: boolean } = {}): Promise<ShouldApplyWithReason> {
        // Apply ONLY if version < 7.1.0
        if (await this.isUnraidVersionLessThanOrEqualTo('7.1.0', { includePrerelease: false })) {
            return super.shouldApply({ checkOsVersion: false });
        }

        return {
            shouldApply: false,
            reason: 'Patch only applies to Unraid versions < 7.1.0',
        };
    }

    protected async generatePatch(overridePath?: string): Promise<string> {
        const fileContent = await readFile(this.filePath, 'utf-8');
        const newContent = this.applyToSource(fileContent);
        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }

    private applyToSource(source: string): string {
        const bodyMatch = source.match(/body\s*\{/);

        if (!bodyMatch) {
            throw new Error(`Could not find body block in ${this.filePath}`);
        }

        const bodyStart = bodyMatch.index!;
        const bodyOpenBraceIndex = bodyStart + bodyMatch[0].length - 1;

        const bodyEndIndex = source.indexOf('}', bodyOpenBraceIndex);

        if (bodyEndIndex === -1) {
            throw new Error(`Could not find end of body block in ${this.filePath}`);
        }

        const insertIndex = bodyEndIndex + 1;

        const before = source.slice(0, insertIndex);
        const after = source.slice(insertIndex);

        return `${before}\n@scope (:root) to (.unapi) {${after}\n}`;
    }
}
