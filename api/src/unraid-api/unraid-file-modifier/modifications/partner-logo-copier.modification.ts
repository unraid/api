import { Logger } from '@nestjs/common';
import { mkdir, symlink, unlink } from 'fs/promises';
import { dirname } from 'path';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { store } from '@app/store/index.js';
import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export class PartnerLogoCopierModification extends FileModification {
    id: string = 'partner-logo-copier';
    public readonly filePath: string;
    private readonly sourcePath: string;
    private readonly targetPath: string;

    constructor(logger: Logger) {
        super(logger);
        const paths = store.getState().paths;
        this.sourcePath = paths.activation.logo;
        this.targetPath = paths.webgui.logo.fullPath;
        this.filePath = this.targetPath;
    }

    protected async generatePatch(): Promise<string> {
        // This modification doesn't generate a patch since it's just copying/symlinking files
        return '';
    }

    public async apply(): Promise<string> {
        try {
            if (await fileExists(this.sourcePath)) {
                this.logger.log('Partner logo found in activation assets, applying...');
                await mkdir(dirname(this.targetPath), { recursive: true });

                try {
                    await unlink(this.targetPath);
                } catch (error) {
                    // Ignore errors if file doesn't exist
                }

                await symlink(this.sourcePath, this.targetPath);
                this.logger.log(`Partner logo symlinked to ${this.targetPath}`);
                return 'Partner logo applied successfully';
            }
            return 'No partner logo found to apply';
        } catch (error) {
            this.logger.error('Error applying partner logo:', error);
            throw error;
        }
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        const sourceExists = await fileExists(this.sourcePath);
        return {
            shouldApply: sourceExists,
            reason: sourceExists
                ? 'Partner logo found in activation assets'
                : 'No partner logo found in activation assets',
        };
    }
}
