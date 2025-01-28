import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { copyFile, unlink } from 'node:fs/promises';

import AuthRequestModification from '@app/unraid-api/unraid-file-modifier/modifications/auth-request.modification';
import SSOFileModification from '@app/unraid-api/unraid-file-modifier/modifications/sso.modification';

export interface ShouldApplyWithReason {
    shouldApply: boolean;
    reason: string;
}

// Step 1: Define the interface
export interface FileModification {
    id: string; // Unique identifier for the operation
    apply(): Promise<void>; // Method to apply the modification
    rollback(): Promise<void>; // Method to roll back the modification
    shouldApply(): Promise<ShouldApplyWithReason>; // Method to determine if the modification should be applied
}

// Step 2: Create a FileModificationService
@Injectable()
export class UnraidFileModificationService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(UnraidFileModificationService.name);
    private history: FileModification[] = []; // Keeps track of applied modifications

    async onModuleInit() {
        try {
            this.logger.log('Loading file modifications...');
            const mods = await this.loadModifications();
            await this.applyModifications(mods);
        } catch (err) {
            this.logger.error(`Failed to apply modifications: ${err}`);
        }
    }
    async onModuleDestroy() {
        try {
            this.logger.log('Rolling back all modifications...');
            await this.rollbackAll();
        } catch (err) {
            this.logger.error(`Failed to roll back modifications: ${err}`);
        }
    }

    /**
     * Dynamically load all file modifications from the specified folder.
     */
    async loadModifications(): Promise<FileModification[]> {
        const modifications: FileModification[] = [];
        const modificationClasses: Array<new (logger: Logger) => FileModification> = [
            AuthRequestModification,
            SSOFileModification,
        ];
        for (const ModificationClass of modificationClasses) {
            const instance = new ModificationClass(this.logger);
            modifications.push(instance);
        }
        return modifications;
    }

    async applyModifications(modifications: FileModification[]): Promise<void> {
        for (const modification of modifications) {
            await this.applyModification(modification);
        }
    }

    /**
     * Apply a file modification.
     * @param modification - The file modification to apply
     */
    async applyModification(modification: FileModification): Promise<void> {
        try {
            const shouldApplyWithReason = await modification.shouldApply();
            if (shouldApplyWithReason.shouldApply) {
                this.logger.log(
                    `Applying modification: ${modification.id} - ${shouldApplyWithReason.reason}`
                );
                await modification.apply();
                this.history.push(modification); // Store modification in history
                this.logger.log(`Modification applied successfully: ${modification.id}`);
            } else {
                this.logger.log(
                    `Skipping modification: ${modification.id} - ${shouldApplyWithReason.reason}`
                );
            }
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error(
                    `Failed to apply modification: ${modification.id}: ${error.message}`,
                    error.stack
                );
            } else {
                this.logger.error(`Failed to apply modification: ${modification.id}: ${error}`);
            }
            throw error;
        }
    }

    /**
     * Roll back all applied modifications in reverse order.
     */
    async rollbackAll(): Promise<void> {
        while (this.history.length > 0) {
            const modification = this.history.pop(); // Get the last applied modification
            if (modification) {
                try {
                    this.logger.log(`Rolling back modification: ${modification.id}`);
                    await modification.rollback();
                    this.logger.log(`Modification rolled back successfully: ${modification.id}`);
                } catch (error) {
                    if (error instanceof Error) {
                        this.logger.error(
                            `Failed to roll back modification: ${modification.id}: ${error.message}`,
                            error.stack
                        );
                    } else {
                        this.logger.error(
                            `Failed to roll back modification: ${modification.id}: ${error}`
                        );
                    }
                }
            }
        }
    }

    /**
     * Helper method to allow backing up a single file to a .bak file.
     * @param path the file to backup, creates a .bak file in the same directory
     * @throws Error if the file cannot be copied
     */
    public static backupFile = async (path: string, throwOnMissing = true): Promise<void> => {
        try {
            const backupPath = path + '.bak';
            await copyFile(path, backupPath);
        } catch (err) {
            if (throwOnMissing) {
                throw new Error(`File does not exist: ${path}`);
            }
        }
    };

    /**
     *
     * @param path Path to original (not .bak) file
     * @param throwOnMissing Whether to throw an error if the backup file does not exist
     * @throws Error if the backup file does not exist and throwOnMissing is true
     * @returns boolean indicating whether the restore was successful
     */
    public static restoreFile = async (path: string, throwOnMissing = true): Promise<boolean> => {
        const backupPath = path + '.bak';
        try {
            await copyFile(backupPath, path);
            await unlink(backupPath);
            return true;
        } catch {
            if (throwOnMissing) {
                throw new Error(`Backup file does not exist: ${backupPath}`);
            }
            return false;
        }
    };
}
