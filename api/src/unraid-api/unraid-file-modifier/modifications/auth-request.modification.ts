import { Logger } from '@nestjs/common';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';

import { createPatch } from 'diff';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification';

const WEB_COMPS_DIR = '/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/_nuxt/' as const;

const getJsFiles = async (dir: string) => {
    const { glob } = await import('glob');
    const files = await glob(`${dir}/**/*.js`);
    return files.map((file) => file.replace('/usr/local/emhttp', ''));
};

export default class AuthRequestModification extends FileModification {
    public filePath: string = '/usr/local/emhttp/auth-request.php';
    id: string = 'auth-request';

    constructor(logger: Logger) {
        super(logger);
    }

    protected async generatePatch(): Promise<string> {
        const JS_FILES = await getJsFiles(WEB_COMPS_DIR);
        this.logger.debug(`Found ${JS_FILES.length} .js files in ${WEB_COMPS_DIR}`);

        const FILES_TO_ADD = ['/webGui/images/partner-logo.svg', ...JS_FILES];

        if (!existsSync(this.filePath)) {
            throw new Error(`File ${this.filePath} not found.`);
        }

        const fileContent = await readFile(this.filePath, 'utf8');

        if (!fileContent.includes('$arrWhitelist')) {
            throw new Error(`$arrWhitelist array not found in the file.`);
        }

        const filesToAddString = FILES_TO_ADD.map((file) => `  '${file}',`).join('\n');

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
