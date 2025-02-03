import { Logger } from '@nestjs/common';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';

import { createPatch } from 'diff';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification';

export default class AuthRequestModification extends FileModification {
    public filePath: string = '/usr/local/emhttp/auth-request.php';
    public webComponentsDirectory: string =
        '/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/_nuxt/' as const;
    id: string = 'auth-request';

import { join } from 'path';

    private getJsFiles = async (dir: string) => {
        const { glob } = await import('glob');
        const files = await glob(join(dir, '**/*.js'));
        const baseDir = '/usr/local/emhttp';  // TODO: Make this configurable
        return files.map((file) => file.startsWith(baseDir) ? file.slice(baseDir.length) : file);
    };
    protected async generatePatch(): Promise<string> {
        const jsFiles = await this.getJsFiles(this.webComponentsDirectory);
        this.logger.debug(`Found ${jsFiles.length} .js files in ${this.webComponentsDirectory}`);

        const filesToAdd = ['/webGui/images/partner-logo.svg', ...jsFiles];

        if (!existsSync(this.filePath)) {
            throw new Error(`File ${this.filePath} not found.`);
        }

        const fileContent = await readFile(this.filePath, 'utf8');

        if (!fileContent.includes('$arrWhitelist')) {
            throw new Error(`$arrWhitelist array not found in the file.`);
        }

        const filesToAddString = filesToAdd.map((file) => `  '${file}',`).join('\n');

        // Create new content by finding the array declaration and adding our files after it
        const newContent = fileContent.replace(/(\$arrWhitelist\s*=\s*\[)/, `$1\n${filesToAddString}`);

        // Generate and return patch
        const patch = createPatch(this.filePath, fileContent, newContent, undefined, undefined, {
            context: 3,
        });

        return patch;
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        return {
            shouldApply: true,
            reason: 'Always apply the allowed file changes to ensure compatibility.',
        };
    }
}
