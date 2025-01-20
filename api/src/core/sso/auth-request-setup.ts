import { existsSync, write } from 'fs';
import { readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

import { logger } from '@app/core/log';

// Define constants
const AUTH_REQUEST_FILE = '/usr/local/emhttp/auth-request.php';
const WEB_COMPS_DIR = '/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/_nuxt/';

export const setupAuthRequest = async () => {
    // Function to log debug messages
    // Find all .js files in WEB_COMPS_DIR
    const getJSFiles = async (dir) => {
        const jsFiles: string[] = [];

        const findFiles = async (currentDir) => {
            const files = await readdir(currentDir, { withFileTypes: true });
            for (const file of files) {
                const fullPath = path.join(currentDir, file.name);
                if (file.isDirectory()) {
                    findFiles(fullPath);
                } else if (file.isFile() && file.name.endsWith('.js')) {
                    jsFiles.push(fullPath.replace('/usr/local/emhttp', ''));
                }
            }
        };

        await findFiles(dir);
        return jsFiles;
    };

    const JS_FILES = await getJSFiles(WEB_COMPS_DIR);
    logger.debug(`Found ${JS_FILES.length} .js files in ${WEB_COMPS_DIR}`);

    const FILES_TO_ADD = ['/webGui/images/partner-logo.svg', ...JS_FILES];

    if (existsSync(AUTH_REQUEST_FILE)) {
        const fileContent = await readFile(AUTH_REQUEST_FILE, 'utf8');

        if (fileContent.includes('$arrWhitelist')) {
            const backupFile = `${AUTH_REQUEST_FILE}.bak`;
            await writeFile(backupFile, fileContent);
            logger.debug(`Backup of ${AUTH_REQUEST_FILE} created at ${backupFile}`);

            const filesToAddString = FILES_TO_ADD.map((file) => `  '${file}',`).join('\n');

            const updatedContent = fileContent.replace(
                /(\$arrWhitelist\s*=\s*\[)/,
                `$1\n${filesToAddString}`
            );

            await writeFile(AUTH_REQUEST_FILE, updatedContent);
            logger.debug(`Default values and .js files from ${WEB_COMPS_DIR} added to $arrWhitelist.`);
        } else {
            logger.debug(`$arrWhitelist array not found in the file.`);
        }
    } else {
        logger.debug(`File ${AUTH_REQUEST_FILE} not found.`);
    }
};
