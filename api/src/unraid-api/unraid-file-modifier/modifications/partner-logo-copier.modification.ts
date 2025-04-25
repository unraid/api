import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { getters } from '@app/store/index.js';
import { ShouldApplyWithReason } from '@app/unraid-api/unraid-file-modifier/file-modification.js';

@Injectable()
export class PartnerLogoCopierModification {
    private readonly logger = new Logger(PartnerLogoCopierModification.name);
    private readonly partnerLogoSource: string;
    private readonly partnerLogoTarget: string;

    constructor() {
        const paths = getters.paths();
        this.partnerLogoSource = paths.partnerLogoSource;
        this.partnerLogoTarget = paths.partnerLogoTarget;
        this.logger.debug('PartnerLogoCopierModification initialized with paths from store.');
    }

    async apply() {
        this.logger.log('Setting up partner logo...');
        try {
            if (await fileExists(this.partnerLogoSource)) {
                // Ensure the destination directory exists
                await fs.mkdir(path.dirname(this.partnerLogoTarget), { recursive: true });
                // Remove existing link/file if it exists
                try {
                    await fs.unlink(this.partnerLogoTarget);
                } catch (e) {
                    /* ignore if not found */
                }
                await fs.symlink(this.partnerLogoSource, this.partnerLogoTarget);
                this.logger.log(`Partner logo symlinked to ${this.partnerLogoTarget}`);
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
}
