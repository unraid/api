import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { store } from '@app/store/index.js'; // Import the store
import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class CaseModelCopierModification extends FileModification {
    id: string = 'case-model-copier';
    public filePath: string = '/usr/local/emhttp/plugins/dynamix/images/case-model.png';

    private readonly assetsDir: string;
    private readonly webguiImagesDir: string;
    private readonly customCaseFileName = 'case-model.png';

    constructor(logger: Logger) {
        super(logger);
        const paths = store.getState().paths;
        this.assetsDir = path.join(paths.activationBase, 'assets');
        this.webguiImagesDir = paths.webguiImagesBase;
        this.logger.debug('CaseModelCopierModification initialized with paths from store.');
    }
    protected async generatePatch(overridePath?: string): Promise<string> {
        throw new Error('Method not implemented.');
    }

    async apply(): Promise<string> {
        this.logger.log('Applying case model icon copy...');
        const customCaseModelPath = path.join(this.assetsDir, this.customCaseFileName);
        const destPath = path.join(this.webguiImagesDir, this.customCaseFileName);

        try {
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            try {
                await fs.unlink(destPath);
                this.logger.debug(`Removed existing file/link at ${destPath}`);
            } catch (unlinkError: any) {
                if (unlinkError.code !== 'ENOENT') {
                    this.logger.warn(
                        `Could not remove existing file at ${destPath}: ${unlinkError.message}`
                    );
                }
            }
            await fs.copyFile(customCaseModelPath, destPath);
            this.logger.log(`Custom case model icon copied to ${destPath}`);
            return '';
        } catch (error) {
            this.logger.error('Error applying case model icon copy:', error);
            return '';
        }
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        // Check if the custom case model icon file is present in the assets directory
        const customCaseModelPath = path.join(this.assetsDir, this.customCaseFileName);
        const exists = await fileExists(customCaseModelPath);
        return {
            shouldApply: exists,
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
