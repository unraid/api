import { constants } from 'fs';
import { access } from 'fs/promises';
import { readFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class HostsModification extends FileModification {
    id: string = 'hosts';
    public readonly filePath: string = '/etc/hosts' as const;

    protected async generatePatch(overridePath?: string): Promise<string> {
        const originalContent = await readFile(this.filePath, 'utf8');

        const newContent = originalContent
            .split('\n')
            .filter((line) => !line.includes('keys.lime-technology.com'))
            .join('\n');

        return this.createPatchWithDiff(overridePath ?? this.filePath, originalContent, newContent);
    }
}
