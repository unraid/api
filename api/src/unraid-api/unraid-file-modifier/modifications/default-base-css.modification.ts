import { readFile } from 'node:fs/promises';

import { FileModification } from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class DefaultBaseCssModification extends FileModification {
    id = 'default-base-css';
    public readonly filePath = '/usr/local/emhttp/plugins/styles/default-base.css';

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

        const bodyEndIndex = source.indexOf('}', source.indexOf('body {'));

        if (bodyEndIndex === -1) {
            // Fallback or error if we can't find body.
            // In worst case, wrap everything except html?
            // But let's assume standard format per file we've seen.
            throw new Error('Could not find end of body block in default-base.css');
        }

        const insertIndex = bodyEndIndex + 1;

        const before = source.slice(0, insertIndex);
        const after = source.slice(insertIndex);

        return `${before}\n\n@scope (:root) to (.unapi) {${after}\n}`;
    }
}
