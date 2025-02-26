import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { FileModification } from '@app/unraid-api/unraid-file-modifier/file-modification.js';
import AuthRequestModification from '@app/unraid-api/unraid-file-modifier/modifications/auth-request.modification.js';
import DefaultPageLayoutModification from '@app/unraid-api/unraid-file-modifier/modifications/default-page-layout.modification.js';
import { LogRotateModification } from '@app/unraid-api/unraid-file-modifier/modifications/log-rotate.modification.js';
import NotificationsPageModification from '@app/unraid-api/unraid-file-modifier/modifications/notifications-page.modification.js';
import SSOFileModification from '@app/unraid-api/unraid-file-modifier/modifications/sso.modification.js';

@Injectable()
export class UnraidFileModificationService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(UnraidFileModificationService.name);
    private appliedModifications: FileModification[] = [];

    /**
     * Load and apply all modifications on module init
     */
    async onModuleInit() {
        try {
            this.logger.log('Loading file modifications...');
            const mods = await this.loadModifications();
            await this.applyModifications(mods);
        } catch (err) {
            this.logger.error(
                `Failed to apply modifications: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Rollback all applied modifications on module destroy
     */
    async onModuleDestroy() {
        this.logger.log('Rolling back all modifications...');
        await this.rollbackAll();
    }

    /**
     * Load all modifications
     * @returns An array of all loaded modifications
     */
    async loadModifications(): Promise<FileModification[]> {
        const modifications: FileModification[] = [];
        const modificationClasses: Array<new (logger: Logger) => FileModification> = [
            LogRotateModification,
            AuthRequestModification,
            SSOFileModification,
            DefaultPageLayoutModification,
            NotificationsPageModification,
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
     * Apply a single modification
     * @param modification - The modification to apply
     */
    async applyModification(modification: FileModification): Promise<void> {
        try {
            const shouldApplyWithReason = await modification.shouldApply();
            if (shouldApplyWithReason.shouldApply) {
                this.logger.log(
                    `Applying modification: ${modification.id} - ${shouldApplyWithReason.reason}`
                );
                await modification.apply();
                this.appliedModifications.push(modification);
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
                this.logger.error(`Failed to apply modification: ${modification.id}: Unknown error`);
            }
        }
    }

    /**
     * Rollback all applied modifications
     */
    async rollbackAll(): Promise<void> {
        for (const modification of [...this.appliedModifications].reverse()) {
            try {
                this.logger.log(`Rolling back modification: ${modification.id}`);
                await modification.rollback();
                this.logger.log(`Successfully rolled back modification: ${modification.id}`);
            } catch (error) {
                if (error instanceof Error) {
                    this.logger.error(`Failed to roll back modification: ${error.message}`);
                } else {
                    this.logger.error('Failed to roll back modification: Unknown error');
                }
            }
        }
        this.appliedModifications = [];
    }
}
