import { readFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class NginxConfModification extends FileModification {
    id: string = 'nginx-conf';
    public readonly filePath: string = '/etc/nginx/nginx.conf' as const;

    protected async generatePatch(overridePath?: string): Promise<string> {
        const originalContent = await readFile(this.filePath, 'utf8');
        const newContent = originalContent.replace(
            "add_header X-Frame-Options 'SAMEORIGIN';",
            'add_header Content-Security-Policy "frame-ancestors \'self\' https://connect.myunraid.net/";'
        );
        return this.createPatchWithDiff(overridePath ?? this.filePath, originalContent, newContent);
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        const superShouldApply = await super.shouldApply();
        if (!superShouldApply.shouldApply) {
            return superShouldApply;
        }
        const content = await readFile(this.filePath, 'utf8');
        const hasSameOrigin = content.includes("add_header X-Frame-Options 'SAMEORIGIN';");
        if (!hasSameOrigin) {
            return {
                shouldApply: false,
                reason: 'X-Frame-Options SAMEORIGIN header not found in nginx.conf',
            };
        }
        return {
            shouldApply: true,
            reason: 'X-Frame-Options SAMEORIGIN found and needs to be replaced with Content-Security-Policy',
            effects: ['nginx:reload'],
        };
    }
}
