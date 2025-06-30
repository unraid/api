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

        // Use a case-insensitive word-boundary regex so the hostname must appear as an independent token
        // prevents partial string & look-alike conflicts such as "keys.lime-technology.com.example.com"
        const hostPattern = /\bkeys\.lime-technology\.com\b/i;

        const newContent = originalContent
            .split('\n')
            .filter((line) => !hostPattern.test(line))
            .join('\n');

        return this.createPatchWithDiff(overridePath ?? this.filePath, originalContent, newContent);
    }
}
