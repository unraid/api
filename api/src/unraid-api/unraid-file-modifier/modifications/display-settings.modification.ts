import { readFile } from 'node:fs/promises';

import { FileModification } from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class DisplaySettingsModification extends FileModification {
    id: string = 'display-settings';
    public readonly filePath: string = '/usr/local/emhttp/plugins/dynamix/DisplaySettings.page';

    private removeFixedClassFromLanguageSelect(source: string): string {
        // Find lines with locale select and remove class="fixed" from them
        return source
            .split('\n')
            .map((line) => {
                // Check if this line contains the locale select element
                if (line.includes('<select name="locale"') && line.includes('class="fixed"')) {
                    // Remove class="fixed" from the line, handling potential spacing variations
                    return line.replace(/\s*class="fixed"\s*/, ' ').replace(/\s+/g, ' ');
                }
                return line;
            })
            .join('\n');
    }

    private applyToSource(fileContent: string): string {
        const transformers = [this.removeFixedClassFromLanguageSelect.bind(this)];

        return transformers.reduce((content, transformer) => transformer(content), fileContent);
    }

    protected async generatePatch(overridePath?: string): Promise<string> {
        const fileContent = await readFile(this.filePath, 'utf-8');

        const newContent = await this.applyToSource(fileContent);

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }
}
