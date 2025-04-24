import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { store } from '@app/store/index.js'; // Import the store
import { ShouldApplyWithReason } from '@app/unraid-api/unraid-file-modifier/file-modification.js';

@Injectable()
export class PartnerLogoCopierModification {
    private readonly logger = new Logger(PartnerLogoCopierModification.name);
    private readonly assetsDir: string;
    private readonly webguiImagesDir: string;

    constructor() {
        const paths = store.getState().paths;
        this.assetsDir = path.join(paths.activationBase, 'assets');
        this.webguiImagesDir = paths.webguiImagesBase;
        this.logger.debug('PartnerLogoCopierModification initialized with paths from store.');
    }

    async apply() {
        this.logger.log('Setting up partner logo...');
        const partnerLogo = path.join(this.assetsDir, 'logo.svg');
        const linkDest = path.join(this.webguiImagesDir, 'partner-logo.svg');
        try {
            if (await fileExists(partnerLogo)) {
                // Ensure the destination directory exists
                await fs.mkdir(path.dirname(linkDest), { recursive: true });
                // Remove existing link/file if it exists
                try {
                    await fs.unlink(linkDest);
                } catch (e) {
                    /* ignore if not found */
                }
                await fs.symlink(partnerLogo, linkDest);
                this.logger.log(`Partner logo symlinked to ${linkDest}`);
            } else {
                this.logger.log('No partner logo found.');
            }
        } catch (error) {
            this.logger.error('Error setting up partner logo:', error);
            // Optionally re-throw or handle the error appropriately
        }
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        return {
            shouldApply: true,
            reason: 'Always apply the allowed file changes to ensure compatibility.',
        };
    }

    async rollback() {
        this.logger.log('Rolling back partner logo setup...');
        const linkDest = path.join(this.webguiImagesDir, 'partner-logo.svg');
        try {
            // Check if the symlink exists before trying to remove it
            const stats = await fs.lstat(linkDest); // Use lstat to check the link itself
            if (stats.isSymbolicLink()) {
                await fs.unlink(linkDest);
                this.logger.log(`Partner logo symlink removed from ${linkDest}`);
            } else {
                this.logger.log(`No partner logo symlink found at ${linkDest} to remove.`);
            }
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                this.logger.log(`No partner logo symlink found at ${linkDest} to remove.`);
            } else {
                this.logger.error('Error rolling back partner logo setup:', error);
            }
        }
    }
}
