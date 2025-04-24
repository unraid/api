import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { store } from '@app/store/index.js'; // Import the store
import { ShouldApplyWithReason } from '@app/unraid-api/unraid-file-modifier/file-modification.js';

@Injectable()
export class CaseModelCopierModification {
    private readonly logger = new Logger(CaseModelCopierModification.name);
    private readonly assetsDir: string;
    private readonly webguiImagesDir: string;
    private readonly customCaseFileName = 'case-model.png';

    constructor() {
        const paths = store.getState().paths;
        this.assetsDir = path.join(paths.activationBase, 'assets');
        this.webguiImagesDir = paths.webguiImagesBase;
        this.logger.debug('CaseModelCopierModification initialized with paths from store.');
    }

    async apply() {
        this.logger.log('Applying case model icon copy...');
        const customCaseModelPath = path.join(this.assetsDir, this.customCaseFileName);
        const destPath = path.join(this.webguiImagesDir, this.customCaseFileName);

        try {
            if (await fileExists(customCaseModelPath)) {
                this.logger.debug(`Custom case model icon found at ${customCaseModelPath}, copying.`);
                // Ensure the destination directory exists
                await fs.mkdir(path.dirname(destPath), { recursive: true });
                // Remove existing file/link at destination first to avoid errors if it's a symlink etc.
                try {
                    await fs.unlink(destPath);
                    this.logger.debug(`Removed existing file/link at ${destPath}`);
                } catch (unlinkError: any) {
                    if (unlinkError.code !== 'ENOENT') {
                        this.logger.warn(
                            `Could not remove existing file at ${destPath}: ${unlinkError.message}`
                        );
                        // Decide if we should proceed or throw. Let's try proceeding.
                    }
                }
                await fs.copyFile(customCaseModelPath, destPath);
                this.logger.log(`Custom case model icon copied to ${destPath}`);
            } else {
                this.logger.log('Custom case model icon file not found in assets, skipping copy.');
            }
        } catch (error) {
            this.logger.error('Error applying case model icon copy:', error);
        }
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        // This modification ensures the custom icon file is present if it exists in assets.
        // It should likely run on boot or periodically.
        return {
            shouldApply: true,
            reason: 'Ensures the custom case model icon file is correctly placed if available.',
        };
    }

    async rollback() {
        this.logger.log('Rolling back case model icon copy...');
        const destPath = path.join(this.webguiImagesDir, this.customCaseFileName);
        try {
            // Check if the file exists before trying to remove it
            if (await fileExists(destPath)) {
                await fs.unlink(destPath);
                this.logger.log(`Custom case model icon removed from ${destPath}`);
            } else {
                this.logger.log(`Custom case model icon not found at ${destPath}, nothing to remove.`);
            }
        } catch (error: any) {
            // Log ENOENT specifically, otherwise log as an error
            if (error.code === 'ENOENT') {
                this.logger.debug(`Custom case model icon not found at ${destPath} during rollback.`);
            } else {
                this.logger.error('Error rolling back case model icon copy:', error);
            }
        }
    }
}
