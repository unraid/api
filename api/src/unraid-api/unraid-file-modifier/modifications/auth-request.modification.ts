import { readFile } from 'fs/promises';
import { join } from 'node:path';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { FileModification } from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class AuthRequestModification extends FileModification {
    public filePath: string = '/usr/local/emhttp/auth-request.php' as const;
    public webComponentsDirectory: string =
        '/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/' as const;
    id: string = 'auth-request';

    /**
     * Get the list of .js and .css files in the given directory
     * @param dir - The directory to search for .js and .css files
     * @returns The list of .js and .css files in the given directory
     */
    private getAssetFiles = async (dir: string) => {
        const { glob } = await import('glob');
        const files = await glob(join(dir, '**/*.{js,css}'));
        const baseDir = '/usr/local/emhttp';
        return files.map((file) => (file.startsWith(baseDir) ? file.slice(baseDir.length) : file));
    };

    /**
     * Get the pregenerated patch for the auth-request.php file
     * @returns null, we must generate the patch dynamically using the js files on the server
     */
    protected async getPregeneratedPatch(): Promise<string | null> {
        return null;
    }

    /**
     * Generate a patch for the auth-request.php file
     * @param overridePath - The path to override the default file path
     * @returns The patch for the auth-request.php file
     */
    protected async generatePatch(overridePath?: string): Promise<string> {
        const { getters } = await import('@app/store/index.js');
        const assetFiles = await this.getAssetFiles(this.webComponentsDirectory);
        this.logger.debug(
            `Found ${assetFiles.length} asset files (.js and .css) in ${this.webComponentsDirectory}`
        );

        const filesToAdd = [getters.paths().webgui.logo.assetPath, ...assetFiles];

        if (!(await fileExists(this.filePath))) {
            throw new Error(`File ${this.filePath} not found.`);
        }

        const fileContent = await readFile(this.filePath, 'utf8');

        if (!fileContent.includes('$arrWhitelist')) {
            throw new Error(`$arrWhitelist array not found in the file.`);
        }

        const filesToAddString = filesToAdd.map((file) => `  '${file}',`).join('\n');

        // Create new content by finding the array declaration and adding our files after it
        const newContent = fileContent.replace(/(\$arrWhitelist\s*=\s*\[)/, `$1\n${filesToAddString}`);

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }
}
