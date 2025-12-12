import {
    Injectable,
    Logger,
    OnApplicationBootstrap,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ModificationEffect } from '@app/unraid-api/unraid-file-modifier/file-modification.js';
import { NODE_ENV } from '@app/environment.js';
import { FileModificationEffectService } from '@app/unraid-api/unraid-file-modifier/file-modification-effect.service.js';
import { FileModification } from '@app/unraid-api/unraid-file-modifier/file-modification.js';

@Injectable()
export class UnraidFileModificationService
    implements OnModuleInit, OnModuleDestroy, OnApplicationBootstrap
{
    private readonly logger = new Logger(UnraidFileModificationService.name);
    private appliedModifications: FileModification[] = [];
    private effects: Set<ModificationEffect> = new Set();

    constructor(
        private readonly effectService: FileModificationEffectService,
        private readonly configService: ConfigService
    ) {}

    /**
     * Load and apply all modifications on module init
     */
    async onModuleInit() {
        try {
            if (NODE_ENV === 'development') {
                this.logger.log('Skipping file modifications in development mode');
                return;
            }

            this.logger.log('Loading file modifications...');
            const mods = await this.loadModifications();
            await this.applyModifications(mods);
        } catch (err) {
            this.logger.error(
                `Failed to apply modifications: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
        }
    }

    async onApplicationBootstrap() {
        for (const effect of this.effects) {
            try {
                await this.effectService.runEffect(effect);
                this.logger.log(`Applied effect: ${effect}`);
            } catch (err) {
                this.logger.error(err, `Failed to apply effect: ${effect}`);
            }
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
        const modificationModules = import.meta.glob<Record<string, any>>(
            './modifications/*.modification.ts',
            { eager: true }
        );

        this.logger.debug(`Loading ${Object.keys(modificationModules).length} modifications...`);
        for (const path in modificationModules) {
            const module = modificationModules[path];

            // Try to load default export first
            if (module.default) {
                this.logger.debug(`Loading default modification: ${module.default.name}`);
                const ModificationClass = module.default;
                const instance = new ModificationClass(this.logger, this.configService);
                modifications.push(instance);
            }
            // If no default export, try to find the first exported class that extends FileModification
            else {
                const exportedKeys = Object.keys(module).filter(
                    (key) => typeof module[key] === 'function' && key !== '__esModule'
                );

                if (exportedKeys.length > 0) {
                    const firstExportKey = exportedKeys[0];
                    const ExportedClass = module[firstExportKey];

                    // Check if it's a class that extends FileModification
                    if (ExportedClass.prototype instanceof FileModification) {
                        this.logger.debug(`Loading named modification: ${ExportedClass.name}`);
                        const instance = new ExportedClass(this.logger, this.configService);
                        modifications.push(instance);
                    }
                }
            }
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
                shouldApplyWithReason.effects?.forEach((effect) => this.effects.add(effect));
                this.logger.log(`Modification applied successfully: ${modification.id}`);
            } else {
                this.logger.debug(
                    `Skipping modification: ${modification.id} - ${shouldApplyWithReason.reason}`
                );
            }
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Failed to apply modification: ${modification.id}: %o`, error);
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

    /**
     * Apply a specific modification by ID
     * @param modificationId - The ID of the modification to apply
     */
    async applyModificationById(modificationId: string): Promise<void> {
        const modifications = await this.loadModifications();
        const modification = modifications.find((mod) => mod.id === modificationId);

        if (!modification) {
            throw new Error(`Modification with ID "${modificationId}" not found`);
        }

        // Check if already applied
        const isAlreadyApplied = this.appliedModifications.some((mod) => mod.id === modificationId);
        if (isAlreadyApplied) {
            this.logger.debug(`Modification "${modificationId}" is already applied`);
            return;
        }

        await this.applyModification(modification);
    }

    /**
     * Rollback a specific modification by ID
     * @param modificationId - The ID of the modification to rollback
     */
    async rollbackModificationById(modificationId: string): Promise<void> {
        const modification = this.appliedModifications.find((mod) => mod.id === modificationId);

        if (!modification) {
            this.logger.debug(`Modification "${modificationId}" is not currently applied`);
            return;
        }

        try {
            this.logger.debug(`Rolling back modification: ${modification.id}`);
            await modification.rollback();
            this.logger.debug(`Successfully rolled back modification: ${modification.id}`);

            // Remove from applied list
            this.appliedModifications = this.appliedModifications.filter(
                (mod) => mod.id !== modificationId
            );
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Failed to roll back modification: ${error.message}`);
                throw error;
            } else {
                this.logger.error('Failed to roll back modification: Unknown error');
                throw new Error('Failed to roll back modification');
            }
        }
    }
}
