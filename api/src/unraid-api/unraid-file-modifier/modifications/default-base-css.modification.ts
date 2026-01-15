import { readFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class DefaultBaseCssModification extends FileModification {
    id = 'default-base-css';
    public readonly filePath = '/usr/local/emhttp/plugins/dynamix/styles/default-base.css';

    async shouldApply({
        checkOsVersion = true,
    }: { checkOsVersion?: boolean } = {}): Promise<ShouldApplyWithReason> {
        // Apply ONLY if:
        // 1. Version >= 7.1.0 (when default-base.css was introduced/relevant for this patch)
        // 2. Version < 7.4.0 (when these changes are natively included)

        const isGte71 = await this.isUnraidVersionGreaterThanOrEqualTo('7.1.0');
        const isLt74 = !(await this.isUnraidVersionGreaterThanOrEqualTo('7.4.0'));

        if (isGte71 && isLt74) {
            // If version matches, also check if file exists via parent logic
            // passing checkOsVersion: false because we already did our custom check
            return super.shouldApply({ checkOsVersion: false });
        }

        return {
            shouldApply: false,
            reason: 'Patch only applies to Unraid versions >= 7.1.0 and < 7.4.0',
        };
    }

    protected async generatePatch(overridePath?: string): Promise<string> {
        const fileContent = await readFile(this.filePath, 'utf-8');
        const newContent = this.applyToSource(fileContent);
        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }

    private applyToSource(source: string): string {
        // We want to wrap everything after the 'body' selector in a CSS scope
        // @scope (:root) to (.unapi) { ... }

        // Find the end of the body block.
        // It typically looks like:
        // body {
        //    ...
        // }

        const bodyStart = source.indexOf('body {');

        if (bodyStart === -1) {
            throw new Error('Could not find end of body block in default-base.css');
        }

        const bodyEndIndex = source.indexOf('}', bodyStart);

        if (bodyEndIndex === -1) {
            // Fallback or error if we can't find body.
            // In worst case, wrap everything except html?
            // But let's assume standard format per file we've seen.
            throw new Error('Could not find end of body block in default-base.css');
        }

        const insertIndex = bodyEndIndex + 1;

        const before = source.slice(0, insertIndex);
        let after = source.slice(insertIndex);

        // Add :scope to specific selectors as requested
        // Using specific regex to avoid matching comments or unrelated text
        after = after
            // 1. .Theme--sidebar definition e.g. .Theme--sidebar {
            .replace(/(\.Theme--sidebar)(\s*\{)/g, ':scope$1$2')
            // 2. .Theme--sidebar #displaybox
            .replace(/(\.Theme--sidebar)(\s+#displaybox)/g, ':scope$1$2')
            // 4. .Theme--width-boxed #displaybox
            .replace(/(\.Theme--width-boxed)(\s+#displaybox)/g, ':scope$1$2');

        return `${before}\n\n@layer default {\n@scope (:root) to (.unapi) {${after}\n}\n}`;
    }
}
