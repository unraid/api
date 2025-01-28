import { Logger } from '@nestjs/common';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';

import {
    FileModification,
    FileModificationService,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.service';

const AUTH_REQUEST_FILE = '/usr/local/emhttp/auth-request.php' as const;
const WEB_COMPS_DIR = '/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/_nuxt/' as const;

const getJsFiles = async (dir: string) => {
    const { glob } = await import('glob');
    const files = await glob(`${dir}/**/*.js`);
    return files.map((file) => file.replace('/usr/local/emhttp', ''));
};

export default class AuthRequestModification implements FileModification {
    id: string = 'auth-request';

    constructor(private readonly logger: Logger) {
        this.logger = logger;
    }

    async apply(): Promise<void> {
        const JS_FILES = await getJsFiles(WEB_COMPS_DIR);
        this.logger.debug(`Found ${JS_FILES.length} .js files in ${WEB_COMPS_DIR}`);

        const FILES_TO_ADD = ['/webGui/images/partner-logo.svg', ...JS_FILES];

        if (existsSync(AUTH_REQUEST_FILE)) {
            const fileContent = await readFile(AUTH_REQUEST_FILE, 'utf8');

            if (fileContent.includes('$arrWhitelist')) {
                FileModificationService.backupFile(AUTH_REQUEST_FILE, true);
                this.logger.debug(`Backup of ${AUTH_REQUEST_FILE} created.`);

                const filesToAddString = FILES_TO_ADD.map((file) => `  '${file}',`).join('\n');

                const updatedContent = fileContent.replace(
                    /(\$arrWhitelist\s*=\s*\[)/,
                    `$1\n${filesToAddString}`
                );

                await writeFile(AUTH_REQUEST_FILE, updatedContent);
                this.logger.debug(
                    `Default values and .js files from ${WEB_COMPS_DIR} added to $arrWhitelist.`
                );
            } else {
                this.logger.debug(`$arrWhitelist array not found in the file.`);
            }
        } else {
            this.logger.debug(`File ${AUTH_REQUEST_FILE} not found.`);
        }
    }
    async rollback(): Promise<void> {
        // No rollback needed, this is safe to preserve
    }
    async shouldApply(): Promise<ShouldApplyWithReason> {
        return { shouldApply: true, reason: 'Always apply the allowed file changes to ensure compatibility.' };
    }
}
