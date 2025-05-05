import { Logger } from '@nestjs/common';
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
    public filePath: string = store.getState().paths.webgui.caseModel.fullPath;

    private readonly activationCaseModel: string;
    private readonly webGuiCaseModel: string;
    private readonly bootCaseModel: string;

    constructor(logger: Logger) {
        super(logger);
        const paths = store.getState().paths;
        this.activationCaseModel = paths.activation.caseModel;
        this.webGuiCaseModel = paths.webgui.caseModel.fullPath;
        this.bootCaseModel = paths.boot.caseModel;
        this.logger.debug('CaseModelCopierModification initialized with paths from store.');
    }

    protected async generatePatch(overridePath?: string): Promise<string> {
        return '';
    }

    /**
     * No pregenerated patch for a single file
     * @returns null
     */
    protected async getPregeneratedPatch(): Promise<string | null> {
        return null;
    }

    async apply(): Promise<string> {
        this.logger.log('Applying case model icon copy...');

        try {
            await fs.mkdir(path.dirname(this.webGuiCaseModel), { recursive: true });
            try {
                await fs.unlink(this.webGuiCaseModel);
                this.logger.debug(`Removed existing file/link at ${this.webGuiCaseModel}`);
            } catch (unlinkError: any) {
                if (unlinkError.code !== 'ENOENT') {
                    this.logger.warn(
                        `Could not remove existing file at ${this.webGuiCaseModel}: ${unlinkError.message}`
                    );
                }
            }
            await fs.copyFile(this.activationCaseModel, this.webGuiCaseModel);
            this.logger.log(`Custom case model icon copied to ${this.webGuiCaseModel}`);
            return '';
        } catch (error) {
            this.logger.error('Error applying case model icon copy:', error);
            return '';
        }
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        // Check if the file already exists in the boot drive
        const bootFileExists = await fileExists(this.bootCaseModel);

        if (bootFileExists) {
            return {
                shouldApply: false,
                reason: 'Custom case model already exists in boot drive, not overwriting user customization.',
            };
        }

        // Check if the custom case model icon file is present in the assets directory
        const exists = await fileExists(this.activationCaseModel);
        return {
            shouldApply: exists,
            reason: 'Ensures the custom case model icon file is correctly placed if available.',
        };
    }

    /**
     * No rollback needed, we're not modfiying any files that would need to be reverted
     */
    async rollback() {
        return;
    }
}
