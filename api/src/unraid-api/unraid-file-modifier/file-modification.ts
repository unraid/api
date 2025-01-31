import { Logger } from '@nestjs/common';
import { constants } from 'fs';
import { access, readFile, unlink, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';

import { applyPatch, parsePatch, reversePatch } from 'diff';

export interface ShouldApplyWithReason {
    shouldApply: boolean;
    reason: string;
}

// Convert interface to abstract class with default implementations
export abstract class FileModification {
    abstract id: string;
    public abstract readonly filePath: string;

    protected constructor(protected readonly logger: Logger) {}

    // This is the main method that child classes need to implement
    protected abstract generatePatch(): Promise<string>;

    private getPatchFilePath(targetFile: string): string {
        const dir = dirname(targetFile);
        const filename = `${basename(targetFile)}.patch`;
        return join(dir, filename);
    }

    private async savePatch(patchResult: string): Promise<void> {
        const patchFile = this.getPatchFilePath(this.filePath);
        await writeFile(patchFile, patchResult, 'utf8');
    }

    private async loadSavedPatch(targetFile: string): Promise<string | null> {
        const patchFile = this.getPatchFilePath(targetFile);
        try {
            await access(patchFile, constants.R_OK);
            return await readFile(patchFile, 'utf8');
        } catch {
            return null;
        }
    }

    private async getPregeneratedPatch(): Promise<string | null> {
        const patchResults = await import.meta.glob('./modifications/patches/*.patch', {
            query: '?raw',
            import: 'default',
        });

        if (patchResults[`./modifications/patches/${this.id}.patch`]) {
            const loader = Object.values(patchResults)[0];
            const fileContents = await loader();
            this.logger.debug(`Loaded pregenerated patch for ${this.id}`);
            if (typeof fileContents !== 'string') {
                this.logger.error('Invalid patch format on patch: ' + this.id);
                return null;
            }
            return fileContents;
        }

        return null;
    }

    private async applyPatch(patchContents: string): Promise<void> {
        const currentContent = await readFile(this.filePath, 'utf8');
        const parsedPatch = parsePatch(patchContents)[0];
        const results = applyPatch(currentContent, parsedPatch);
        if (results === false) {
            throw new Error(`Failed to apply patch to ${this.filePath}`);
        }
        await writeFile(this.filePath, results);
    }

    // Default implementation of apply that uses the patch
    async apply(): Promise<void> {
        // First attempt to apply the patch that was generated
        const staticPatch = await this.getPregeneratedPatch();
        if (staticPatch) {
            try {
                await this.applyPatch(staticPatch);
                await this.savePatch(staticPatch);
                return;
            } catch (error) {
                this.logger.error(
                    `Failed to apply static patch to ${this.filePath}, continuing with dynamic patch`
                );
            }
        }
        const patchContents = await this.generatePatch();
        await this.applyPatch(patchContents);
        await this.savePatch(patchContents);
    }

    // Update rollback to use the shared utility
    async rollback(): Promise<void> {
        let patch: string;

        // Try to load saved patch first
        const savedPatch = await this.loadSavedPatch(this.filePath);
        if (savedPatch) {
            this.logger.debug(`Using saved patch file for ${this.id}`);
            patch = savedPatch;
        } else {
            this.logger.debug(`No saved patch found for ${this.id}, generating new patch`);
            const patchContents = await this.generatePatch();
            patch = patchContents;
        }

        const currentContent = await readFile(this.filePath, 'utf8');
        const parsedPatch = parsePatch(patch)[0];

        if (!parsedPatch || !parsedPatch.hunks || parsedPatch.hunks.length === 0) {
            throw new Error('Invalid or empty patch content');
        }

        const reversedPatch = reversePatch(parsedPatch);
        const results = applyPatch(currentContent, reversedPatch);

        if (results === false) {
            throw new Error(`Failed to rollback patch from ${this.filePath}`);
        }

        await writeFile(this.filePath, results);

        // Clean up the patch file after successful rollback
        try {
            const patchFile = this.getPatchFilePath(this.filePath);
            await access(patchFile, constants.W_OK);
            await unlink(patchFile);
        } catch {
            // Ignore errors when trying to delete the patch file
        }
    }

    // Default implementation that can be overridden if needed
    async shouldApply(): Promise<ShouldApplyWithReason> {
        return {
            shouldApply: true,
            reason: 'Default behavior is to always apply modifications',
        };
    }
}
