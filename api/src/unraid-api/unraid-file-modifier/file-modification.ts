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

    public constructor(protected readonly logger: Logger) {}

    // This is the main method that child classes need to implement
    protected abstract generatePatch(overridePath?: string): Promise<string>;

    private getPatchFilePath(targetFile: string): string {
        const dir = dirname(targetFile);
        const filename = `${basename(targetFile)}.patch`;
        return join(dir, filename);
    }

    private async savePatch(patchResult: string): Promise<void> {
        const patchFilePath = this.getPatchFilePath(this.filePath);
        await writeFile(patchFilePath, patchResult, 'utf8');
    }

    /**
     * Loads the applied patch for the target file if it exists
     * @param targetFile - The path to the file to be patched
     * @returns The patch contents if it exists (targetFile.patch), null otherwise
     */
    private async loadPatchedFilePatch(targetFile: string): Promise<string | null> {
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
        const patchPath = `./modifications/patches/${this.id}.patch`;
        const loader = patchResults[patchPath];

        if (typeof loader === 'function') {
            const fileContents = await loader();
            this.logger.debug(`Loaded pregenerated patch for ${this.id}`);
            if (typeof fileContents !== 'string') {
                this.logger.error('Invalid patch format on patch: ' + this.id);
                return null;
            }
            return fileContents;
        } else {
            this.logger.warn('Could not load pregenerated patch for: ' + this.id);
            return null;
        }
    }

    private async applyPatch(patchContents: string): Promise<void> {
        if (!patchContents.trim()) {
            throw new Error('Patch contents are empty');
        }
        const currentContent = await readFile(this.filePath, 'utf8');
        const parsedPatch = parsePatch(patchContents)[0];
        if (!parsedPatch?.hunks.length) {
            throw new Error('Invalid Patch Format: No hunks found');
        }
        const results = applyPatch(currentContent, parsedPatch);
        if (results === false) {
            throw new Error(`Failed to apply patch to ${this.filePath}`);
        }
        await writeFile(this.filePath, results);
    }

    async apply(): Promise<void> {
        try {
            const savedPatch = await this.loadPatchedFilePatch(this.filePath);
            if (savedPatch) {
                // Rollback the saved patch before applying the new patch
                await this.rollback();
            }
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
        } catch (err) {
            this.logger.error(`Failed to apply patch to ${this.filePath}: ${err}`);
        }
    }

    async rollback(): Promise<void> {
        let patch: string;

        // Try to load saved patch first
        const savedPatch = await this.loadPatchedFilePatch(this.filePath);
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
            this.logger.warn(`Failed to delete patch file for ${this.id}`);
        }
    }

    // Default implementation that can be overridden if needed
    async shouldApply(): Promise<ShouldApplyWithReason> {
        try {
            if (!this.filePath || !this.id) {
                throw new Error('Invalid file modification configuration');
            }

            const fileExists = await access(this.filePath, constants.R_OK | constants.W_OK)
                .then(() => true)
                .catch(() => false);

            if (!fileExists) {
                return {
                    shouldApply: false,
                    reason: `Target file ${this.filePath} does not exist or is not accessible`,
                };
            }
            return {
                shouldApply: true,
                reason: 'Default behavior is to apply modifications if the file exists',
            };
        } catch (err) {
            this.logger.error(`Failed to check if file ${this.filePath} should be applied: ${err}`);
            return {
                shouldApply: false,
                reason: `Failed to check if file ${this.filePath} should be applied: ${err}`,
            };
        }
    }
}
