import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import AuthRequestModification from '@app/unraid-api/unraid-file-modifier/modifications/auth-request.modification';
import SSOFileModification from '@app/unraid-api/unraid-file-modifier/modifications/sso.modification';
import { LogRotateModification } from '@app/unraid-api/unraid-file-modifier/modifications/log-rotate.modification';

import DefaultPageLayoutModification from './modifications/default-page-layout.modification';

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
        this.logger.log('Rolling back all modifications...');
        await this.rollbackAll();
    }

    /**
     * Dynamically load all file modifications from the specified folder.
     */
    async loadModifications(): Promise<FileModification[]> {
        const modifications: FileModification[] = [];
        const modificationClasses: Array<new (logger: Logger) => FileModification> = [
            LogRotateModification,
            AuthRequestModification,
            SSOFileModification,
            DefaultPageLayoutModification,
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
}
