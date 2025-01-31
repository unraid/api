import { Logger } from '@nestjs/common';
import { readFile, writeFile, access, unlink } from 'fs/promises';
import { constants } from 'fs';
import { join, dirname, basename } from 'path';
import { applyPatch, parsePatch, reversePatch } from 'diff';

export interface PatchResult {
    targetFile: string;
    patch: string;
}

export interface ShouldApplyWithReason {
    shouldApply: boolean;
    reason: string;
}

// Convert interface to abstract class with default implementations
export abstract class FileModification {
    abstract id: string;
    
    protected constructor(protected readonly logger: Logger) {}

    // This is the main method that child classes need to implement
    protected abstract generatePatch(): Promise<PatchResult>;

    private getPatchFilePath(targetFile: string): string {
        const dir = dirname(targetFile);
        const filename = `${basename(targetFile)}.patch`;
        return join(dir, filename);
    }

    private async savePatch(patchResult: PatchResult): Promise<void> {
        const patchFile = this.getPatchFilePath(patchResult.targetFile);
        await writeFile(patchFile, patchResult.patch, 'utf8');
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

    // Default implementation of apply that uses the patch
    async apply(): Promise<void> {
        const patchResult = await this.generatePatch();
        const { targetFile, patch } = patchResult;
        const currentContent = await readFile(targetFile, 'utf8');
        const parsedPatch = parsePatch(patch)[0];
        const results = applyPatch(currentContent, parsedPatch);
        if (results === false) {
            throw new Error(`Failed to apply patch to ${targetFile}`);
        }

        await writeFile(targetFile, results);
        await this.savePatch(patchResult);
    }

    // Update rollback to use the shared utility
    async rollback(): Promise<void> {
        const { targetFile } = await this.generatePatch();
        let patch: string;

        // Try to load saved patch first
        const savedPatch = await this.loadSavedPatch(targetFile);
        if (savedPatch) {
            this.logger.debug(`Using saved patch file for ${this.id}`);
            patch = savedPatch;
        } else {
            this.logger.debug(`No saved patch found for ${this.id}, generating new patch`);
            const patchResult = await this.generatePatch();
            patch = patchResult.patch;
        }

        const currentContent = await readFile(targetFile, 'utf8');
        const parsedPatch = parsePatch(patch)[0];

        if (!parsedPatch || !parsedPatch.hunks || parsedPatch.hunks.length === 0) {
            throw new Error('Invalid or empty patch content');
        }

        const reversedPatch = reversePatch(parsedPatch);
        const results = applyPatch(currentContent, reversedPatch);

        if (results === false) {
            throw new Error(`Failed to rollback patch from ${targetFile}`);
        }

        await writeFile(targetFile, results);
        
        // Clean up the patch file after successful rollback
        try {
            const patchFile = this.getPatchFilePath(targetFile);
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
