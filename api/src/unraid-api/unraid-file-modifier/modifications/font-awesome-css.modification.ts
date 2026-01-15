import { readFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class FontAwesomeCssModification extends FileModification {
    id = 'font-awesome-css-modification';
    public readonly filePath = '/usr/local/emhttp/webGui/styles/font-awesome.css';

    async shouldApply({
        checkOsVersion = true,
    }: { checkOsVersion?: boolean } = {}): Promise<ShouldApplyWithReason> {
        // Apply ONLY if version < 7.4.0
        if (await this.isUnraidVersionGreaterThanOrEqualTo('7.4.0', { includePrerelease: false })) {
            return {
                shouldApply: false,
                reason: 'Patch only applies to Unraid versions < 7.4.0',
            };
        }

        return super.shouldApply({ checkOsVersion: false });
    }

    protected async generatePatch(overridePath?: string): Promise<string> {
        const fileContent = await readFile(this.filePath, 'utf-8');
        const newContent = this.applyToSource(fileContent);
        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }

    private applyToSource(source: string): string {
        // Try to separate the license header from the rest of the content
        const headerMatch = source.match(/^(\/\*[\s\S]*?\*\/)/);

        if (headerMatch) {
            const header = headerMatch[1];
            // Get everything after the header
            const rest = source.slice(header.length);
            // Ensure we trim leading/trailing whitespace from the rest to keep it clean,
            // but might want to preserve initial newlines if any.
            // The user example shows the wrapped content starting on a new line.

            return `${header}\n@layer default {\n\t@scope (:root) to (.unapi) {\n${rest}\n\t}\n}`;
        }

        // If no header found, wrap potentially everything
        return `@layer default {\n\t@scope (:root) to (.unapi) {\n${source}\n\t}\n}`;
    }
}
