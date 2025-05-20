import { Logger } from '@nestjs/common';
import { constants } from 'fs';
import { access, readFile, unlink, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';

import { applyPatch, createPatch, parsePatch, reversePatch } from 'diff';
import { coerce, compare, gte } from 'semver';

import { getUnraidVersion } from '@app/common/dashboard/get-unraid-version.js';

export interface ShouldApplyWithReason {
    shouldApply: boolean;
    reason: string;
}

// Convert interface to abstract class with default implementations
export abstract class FileModification {
    abstract id: string;
    public abstract readonly filePath: string;

    public constructor(protected readonly logger: Logger) {}

    /**
     * Generate the patch for the target filePath
     * @param overridePath - The path displayed in the patch file
     */
    protected abstract generatePatch(overridePath?: string): Promise<string>;

    /**
     * Get the path to the applied patch file for the target filePath, saved after applying the patch
     * @param targetFile - The path to the file that was patched
     */
    protected getPathToAppliedPatch(targetFile = this.filePath): string {
        const dir = dirname(targetFile);
        const filename = `${basename(targetFile)}.patch`;
        return join(dir, filename);
    }

    /**
     * Save the patch to disk, next to the changed file
     * @param patchResult - The patch to save to filePath.patch
     */
    private async savePatch(patchResult: string): Promise<void> {
        const patchFilePath = this.getPathToAppliedPatch(this.filePath);
        await writeFile(patchFilePath, patchResult, 'utf8');
    }

    /**
     * Loads the applied patch for the target file if it exists
     * @param targetFile - The path to the file to be patched
     * @returns The patch contents if it exists (targetFile.patch), null otherwise
     */
    private async loadPatchedFilePatch(targetFile: string): Promise<string | null> {
        const patchFile = this.getPathToAppliedPatch(targetFile);
        try {
            await access(patchFile, constants.R_OK);
            return await readFile(patchFile, 'utf8');
        } catch {
            return null;
        }
    }

    /**
     * Load the pregenerated patch for the target file
     * @returns The patch contents if it exists (targetFile.patch), null otherwise
     */
    protected async getPregeneratedPatch(): Promise<string | null> {
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

    /**
     * Apply the patch to the target file
     * @param patchContents - The patch to apply
     * @returns The result of the patch
     */
    private async applyPatch(patchContents: string): Promise<string> {
        if (!patchContents.trim()) {
            throw new Error('Patch contents are empty');
        }
        const currentContent = await readFile(this.filePath, 'utf8').catch(() => '');
        const parsedPatch = parsePatch(patchContents)[0];
        if (!parsedPatch?.hunks.length) {
            throw new Error('Invalid Patch Format: No hunks found');
        }

        const results = applyPatch(currentContent, parsedPatch);
        if (results === false) {
            throw new Error(`Failed to apply patch to ${this.filePath}`);
        }
        await writeFile(this.filePath, results);
        return results;
    }

    /**
     * Apply the patch for the target file
     * Attempts to apply the pregenerated patch first, then the dynamically generated patch
     * Will roll back the already applied patch before running if the .patch file exists next to the target file
     * @returns The result of the patch
     */
    async apply(): Promise<string> {
        try {
            // First attempt to rollback an existing patch saved on disk (if the file has already been modified by us, unclean shutdown)
            await this.rollback(true).catch((err) => {
                this.logger.debug(
                    `Failed to rollback patch for ${this.id}: ${err}, may not have been applied yet`
                );
            });
            // First attempt to apply the patch that was generated
            const staticPatch = await this.getPregeneratedPatch();
            if (staticPatch) {
                try {
                    await this.applyPatch(staticPatch);
                    await this.savePatch(staticPatch);
                    return staticPatch;
                } catch (error) {
                    this.logger.error(
                        `Failed to apply static patch to ${this.filePath}, continuing with dynamic patch`
                    );
                }
            }
            const patchContents = await this.generatePatch();
            await this.applyPatch(patchContents);
            await this.savePatch(patchContents);
            return patchContents;
        } catch (err) {
            this.logger.error(`Failed to apply patch to ${this.filePath}: ${err}`);
            throw err;
        }
    }

    /**
     * Rollback the patch for the target file
     * @param useSavedPatchOnly - If true, only use the saved patch file if it exists, otherwise use the file or generate a new patch
     */
    async rollback(useSavedPatchOnly: boolean = false): Promise<void> {
        let patch: string | null = null;

        // Try to load saved patch first
        const savedPatch = await this.loadPatchedFilePatch(this.filePath);
        if (savedPatch) {
            this.logger.debug(`Using saved patch file for ${this.id}`);
            patch = savedPatch;
        } else if (!useSavedPatchOnly) {
            this.logger.debug(`No saved patch found for ${this.id}, generating new patch`);
            const patchContents = await this.generatePatch();
            patch = patchContents;
        }

        if (!patch) {
            throw new Error(`No patch found to rollback for ${this.id}`);
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

        if (results === '') {
            // Delete the file if the patch results in an empty string
            await unlink(this.filePath);
        } else {
            await writeFile(this.filePath, results);
        }

        // Clean up the patch file after successful rollback
        try {
            const patchFile = this.getPathToAppliedPatch(this.filePath);
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

    async createPatchWithDiff(
        filePath: string,
        originalContent: string,
        newContent: string
    ): Promise<string> {
        const patch = createPatch(filePath, originalContent, newContent, 'original', 'modified', {
            context: 5,
        });
        return patch;
    }

    protected async isUnraidVersionGreaterThanOrEqualTo(
        version: string = '7.2.0', // Defaults to the version of Unraid that includes the API by default
        { includePrerelease = true }: { includePrerelease?: boolean } = {}
    ): Promise<boolean> {
        const unraidVersion = coerce(await getUnraidVersion(), { includePrerelease });
        const comparedVersion = coerce(version, { includePrerelease });
        if (!unraidVersion) {
            throw new Error(`Failed to compare Unraid version - missing unraid version`);
        }
        if (!comparedVersion) {
            throw new Error(`Failed to compare Unraid version - missing comparison version`);
        }
        // If includePrerelease and base versions are equal, treat prerelease as greater
        if (includePrerelease) {
            const baseUnraid = `${unraidVersion.major}.${unraidVersion.minor}.${unraidVersion.patch}`;
            const baseCompared = `${comparedVersion.major}.${comparedVersion.minor}.${comparedVersion.patch}`;
            if (baseUnraid === baseCompared) {
                // If unraidVersion has prerelease and comparedVersion does not, treat as greater
                if (unraidVersion.prerelease.length && !comparedVersion.prerelease.length) {
                    return true;
                }
            }
        }
        return gte(unraidVersion, comparedVersion);
    }
}
