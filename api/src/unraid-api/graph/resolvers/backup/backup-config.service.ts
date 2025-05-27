import { forwardRef, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

import { CronJob } from 'cron';
import { v4 as uuidv4 } from 'uuid';

import { getters } from '@app/store/index.js';
import {
    BackupJobConfig,
    CreateBackupJobConfigInput,
    UpdateBackupJobConfigInput,
} from '@app/unraid-api/graph/resolvers/backup/backup.model.js';
import {
    DestinationConfigInput,
    DestinationType,
    RcloneDestinationConfig,
} from '@app/unraid-api/graph/resolvers/backup/destination/backup-destination.types.js';
import { BackupOrchestrationService } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-orchestration.service.js';
import {
    FlashPreprocessConfig,
    RawBackupConfig,
    ScriptPreprocessConfig,
    SourceConfigInput,
    SourceType,
    ZfsPreprocessConfig,
} from '@app/unraid-api/graph/resolvers/backup/source/backup-source.types.js';
import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';

const JOB_GROUP_PREFIX = 'backup-';

@Injectable()
export class BackupConfigService implements OnModuleInit {
    private readonly logger = new Logger(BackupConfigService.name);
    private readonly configPath: string;
    private configs: Map<string, BackupJobConfig> = new Map();

    constructor(
        private readonly rcloneService: RCloneService,
        private readonly schedulerRegistry: SchedulerRegistry,
        @Inject(forwardRef(() => BackupOrchestrationService))
        private readonly backupOrchestrationService: BackupOrchestrationService
    ) {
        const paths = getters.paths();
        this.configPath = join(paths.backupBase, 'backup-jobs.json');
    }

    async onModuleInit(): Promise<void> {
        await this.loadConfigs();
    }

    private transformSourceConfigInput(
        input: SourceConfigInput
    ): ZfsPreprocessConfig | FlashPreprocessConfig | ScriptPreprocessConfig | RawBackupConfig {
        switch (input.type) {
            case SourceType.ZFS:
                if (!input.zfsConfig) {
                    throw new Error('ZFS configuration is required when type is ZFS');
                }
                const zfsConfig = new ZfsPreprocessConfig();
                zfsConfig.label = input.zfsConfig.label || 'ZFS backup';
                zfsConfig.poolName = input.zfsConfig.poolName;
                zfsConfig.datasetName = input.zfsConfig.datasetName;
                zfsConfig.snapshotPrefix = input.zfsConfig.snapshotPrefix;
                zfsConfig.cleanupSnapshots = input.zfsConfig.cleanupSnapshots ?? true;
                zfsConfig.retainSnapshots = input.zfsConfig.retainSnapshots;
                return zfsConfig;

            case SourceType.FLASH:
                if (!input.flashConfig) {
                    throw new Error('Flash configuration is required when type is FLASH');
                }
                const flashConfig = new FlashPreprocessConfig();
                flashConfig.label = input.flashConfig.label || 'Flash drive backup';
                flashConfig.flashPath = input.flashConfig.flashPath || '/boot';
                flashConfig.includeGitHistory = input.flashConfig.includeGitHistory ?? true;
                flashConfig.additionalPaths = input.flashConfig.additionalPaths || [];
                return flashConfig;

            case SourceType.SCRIPT:
                if (!input.scriptConfig) {
                    throw new Error('Script configuration is required when type is SCRIPT');
                }
                const scriptConfig = new ScriptPreprocessConfig();
                scriptConfig.label = input.scriptConfig.label || 'Script backup';
                scriptConfig.scriptPath = input.scriptConfig.scriptPath;
                scriptConfig.scriptArgs = input.scriptConfig.scriptArgs || [];
                scriptConfig.workingDirectory = input.scriptConfig.workingDirectory;
                scriptConfig.environment = input.scriptConfig.environment;
                scriptConfig.outputPath = input.scriptConfig.outputPath;
                return scriptConfig;

            case SourceType.RAW:
                if (!input.rawConfig) {
                    throw new Error('Raw configuration is required when type is RAW');
                }
                const rawConfig = new RawBackupConfig();
                rawConfig.label = input.rawConfig.label || 'Raw file backup';
                rawConfig.sourcePath = input.rawConfig.sourcePath;
                rawConfig.excludePatterns = input.rawConfig.excludePatterns || [];
                rawConfig.includePatterns = input.rawConfig.includePatterns || [];
                return rawConfig;

            default:
                throw new Error(`Unsupported source type: ${input.type}`);
        }
    }

    private transformDestinationConfigInput(input: DestinationConfigInput): RcloneDestinationConfig {
        switch (input.type) {
            case DestinationType.RCLONE:
                if (!input.rcloneConfig) {
                    throw new Error('RClone configuration is required when type is RCLONE');
                }
                const rcloneConfig = new RcloneDestinationConfig();
                rcloneConfig.type = 'RCLONE';
                rcloneConfig.remoteName = input.rcloneConfig.remoteName;
                rcloneConfig.destinationPath = input.rcloneConfig.destinationPath;
                rcloneConfig.rcloneOptions = input.rcloneConfig.rcloneOptions;
                return rcloneConfig;

            default:
                throw new Error(`Unsupported destination type: ${input.type}`);
        }
    }

    async createBackupJobConfig(input: CreateBackupJobConfigInput): Promise<BackupJobConfig> {
        const id = uuidv4();
        const now = new Date().toISOString();

        // Validate input sourceConfig and destinationConfig presence
        if (!input.sourceConfig) {
            this.logger.error('Source configuration (sourceConfig) is required.');
            throw new Error('Source configuration (sourceConfig) is required.');
        }
        if (!input.destinationConfig) {
            this.logger.error('Destination configuration (destinationConfig) is required.');
            throw new Error('Destination configuration (destinationConfig) is required.');
        }

        // Extract sourceType and destinationType from the respective config objects
        const sourceType = input.sourceConfig.type;
        const destinationType = input.destinationConfig.type;

        if (!sourceType) {
            this.logger.error("Source configuration must include a valid 'type' property.");
            throw new Error("Source configuration must include a valid 'type' property.");
        }
        if (!destinationType) {
            this.logger.error("Destination configuration must include a valid 'type' property.");
            throw new Error("Destination configuration must include a valid 'type' property.");
        }

        // Transform the source config input into the appropriate union member
        const transformedSourceConfig = this.transformSourceConfigInput(input.sourceConfig);

        // Transform the destination config input into the appropriate union member
        const transformedDestinationConfig = this.transformDestinationConfigInput(
            input.destinationConfig
        );

        const config: BackupJobConfig = {
            id,
            name: input.name,
            sourceType,
            destinationType,
            schedule: input.schedule || '0 2 * * *',
            enabled: input.enabled,
            sourceConfig: transformedSourceConfig,
            destinationConfig: transformedDestinationConfig,
            createdAt: now,
            updatedAt: now,
        };

        this.configs.set(id, config);
        await this.saveConfigs();

        if (config.enabled) {
            this.scheduleJob(config);
        }

        return config;
    }

    async updateBackupJobConfig(
        id: string,
        input: UpdateBackupJobConfigInput
    ): Promise<BackupJobConfig | null> {
        this.logger.debug(
            `[updateBackupJobConfig] Called with ID: ${id}, Input: ${JSON.stringify(input)}`
        );
        const existing = this.configs.get(id);
        if (!existing) {
            this.logger.warn(`[updateBackupJobConfig] No existing config found for ID: ${id}`);
            return null;
        }
        this.logger.debug(
            `[updateBackupJobConfig] Existing config for ID ${id}: ${JSON.stringify(existing)}`
        );

        // Handle sourceConfig update
        let updatedSourceConfig = existing.sourceConfig;
        let updatedSourceType = existing.sourceType;
        if (input.sourceConfig) {
            const inputSourceType = input.sourceConfig.type;
            if (!inputSourceType) {
                this.logger.warn(
                    `[updateBackupJobConfig] Source config update for ID ${id} is missing 'type'. Update skipped for sourceConfig.`
                );
            } else {
                // Transform the input into the appropriate union member
                updatedSourceConfig = this.transformSourceConfigInput(input.sourceConfig);
                updatedSourceType = inputSourceType;
                this.logger.debug(`[updateBackupJobConfig] Transformed sourceConfig for ${id}.`);
            }
        }

        // Handle destinationConfig update
        let updatedDestinationConfig = existing.destinationConfig;
        let updatedDestinationType = existing.destinationType;
        if (input.destinationConfig) {
            const inputDestinationType = input.destinationConfig.type;
            if (!inputDestinationType) {
                this.logger.warn(
                    `[updateBackupJobConfig] Destination config update for ID ${id} is missing 'type'. Update skipped for destinationConfig.`
                );
            } else {
                // Transform the input into the appropriate union member
                updatedDestinationConfig = this.transformDestinationConfigInput(input.destinationConfig);
                updatedDestinationType = inputDestinationType;
                this.logger.debug(`[updateBackupJobConfig] Updated destinationConfig for ${id}.`);
            }
        }

        const updated: BackupJobConfig = {
            ...existing,
            name: input.name ?? existing.name,
            schedule: input.schedule ?? existing.schedule,
            enabled: input.enabled ?? existing.enabled,
            sourceType: updatedSourceType,
            destinationType: updatedDestinationType,
            sourceConfig: updatedSourceConfig,
            destinationConfig: updatedDestinationConfig,
            updatedAt: new Date().toISOString(),
            lastRunAt: input.lastRunAt !== undefined ? input.lastRunAt : existing.lastRunAt,
            lastRunStatus:
                input.lastRunStatus !== undefined ? input.lastRunStatus : existing.lastRunStatus,
        };

        this.logger.debug(
            `[updateBackupJobConfig] Updated object for ID ${id} (before set): ${JSON.stringify(updated)}`
        );

        this.configs.set(id, updated);
        await this.saveConfigs();
        this.logger.debug(`[updateBackupJobConfig] Configs saved for ID: ${id}`);

        this.unscheduleJob(id);
        if (updated.enabled) {
            this.scheduleJob(updated);
        }

        return updated;
    }

    async deleteBackupJobConfig(id: string): Promise<boolean> {
        const config = this.configs.get(id);
        if (!config) return false;

        this.unscheduleJob(id);
        this.configs.delete(id);
        await this.saveConfigs();
        return true;
    }

    async getBackupJobConfig(id: string): Promise<BackupJobConfig | null> {
        this.logger.debug(`[getBackupJobConfig] Called for ID: ${id}`);
        const config = this.configs.get(id);
        if (config) {
            this.logger.debug(
                `[getBackupJobConfig] Found config for ID ${id}: ${JSON.stringify(config)}`
            );
        } else {
            this.logger.warn(`[getBackupJobConfig] No config found for ID: ${id}`);
        }
        return config || null;
    }

    async getAllBackupJobConfigs(): Promise<BackupJobConfig[]> {
        return Array.from(this.configs.values());
    }

    private transformPlainObjectToSourceConfig(
        obj: any,
        sourceType: SourceType
    ): ZfsPreprocessConfig | FlashPreprocessConfig | ScriptPreprocessConfig | RawBackupConfig {
        switch (sourceType) {
            case SourceType.ZFS: {
                const zfsConfig = new ZfsPreprocessConfig();
                Object.assign(zfsConfig, obj);
                return zfsConfig;
            }
            case SourceType.FLASH: {
                const flashConfig = new FlashPreprocessConfig();
                Object.assign(flashConfig, obj);
                return flashConfig;
            }
            case SourceType.SCRIPT: {
                const scriptConfig = new ScriptPreprocessConfig();
                Object.assign(scriptConfig, obj);
                return scriptConfig;
            }
            case SourceType.RAW: {
                const rawConfig = new RawBackupConfig();
                Object.assign(rawConfig, obj);
                return rawConfig;
            }
            default:
                // Consider logging an unknown sourceType if not caught by earlier validation
                this.logger.error(
                    `Unsupported source type encountered during plain object transformation: ${sourceType as string}`
                );
                throw new Error(`Unsupported source type: ${sourceType as string}`);
        }
    }

    private transformPlainObjectToDestinationConfig(
        obj: any,
        destinationType: DestinationType
    ): RcloneDestinationConfig {
        switch (destinationType) {
            case DestinationType.RCLONE:
                const rcloneConfig = new RcloneDestinationConfig();
                Object.assign(rcloneConfig, obj);
                return rcloneConfig;

            default:
                throw new Error(`Unsupported destination type: ${destinationType}`);
        }
    }

    private async executeBackupJob(config: BackupJobConfig): Promise<void> {
        this.logger.log(
            `Executing backup job via BackupOrchestrationService: ${config.name} (ID: ${config.id})`
        );

        // Prepare updates, currentJobId will be set after job starts
        const updatesForInMemoryConfig: Partial<BackupJobConfig> = {
            lastRunAt: new Date().toISOString(),
            lastRunStatus: 'Starting...',
            currentJobId: undefined, // Initialize
        };

        try {
            // Delegate to the BackupOrchestrationService and get the jobId
            // IMPORTANT: This assumes backupOrchestrationService.executeBackupJob is modified to return the jobId string
            const jobId = await this.backupOrchestrationService.executeBackupJob(config, config.id);

            if (jobId) {
                updatesForInMemoryConfig.currentJobId = jobId;
                this.logger.log(
                    `Backup job ${config.name} (ID: ${config.id}) initiated by BackupOrchestrationService with Job ID: ${jobId}.`
                );
            } else {
                this.logger.warn(
                    `BackupOrchestrationService.executeBackupJob did not return a jobId for config ${config.id}. currentJobId will not be set.`
                );
            }

            // Update the in-memory config with all changes including currentJobId
            const currentConfig = this.configs.get(config.id);
            if (currentConfig) {
                this.configs.set(config.id, {
                    ...currentConfig,
                    ...updatesForInMemoryConfig,
                });
            } else {
                this.logger.warn(
                    `Config ${config.id} not found in memory map after starting job. State may be inconsistent.`
                );
                // Fallback: attempt to set it anyway, though this indicates a potential issue
                this.configs.set(config.id, {
                    ...config, // Use the passed config as a base
                    ...updatesForInMemoryConfig,
                });
            }

            // Persist only non-transient parts to backup-jobs.json
            // Create a separate object for saving that omits currentJobId
            const configToPersist = {
                ...(this.configs.get(config.id) || config), // Get the most up-to-date version from memory
            };
            delete configToPersist.currentJobId; // Ensure currentJobId is not persisted
            configToPersist.lastRunAt = updatesForInMemoryConfig.lastRunAt;
            configToPersist.lastRunStatus = updatesForInMemoryConfig.lastRunStatus;

            // Update the map with the version to be persisted, then save
            // This is tricky because we want currentJobId in memory but not on disk.
            // A better approach might be to manage currentJobId in a separate map or handle it during serialization.
            // For now, we'll update the main config, then save a version without currentJobId.
            // This means this.configs.get(config.id) will have currentJobId.

            // Create a shallow copy for saving, minus currentJobId.
            const { currentJobId: _, ...persistentConfigData } = this.configs.get(config.id)!;
            // Create a new map for saving or filter this.configs map during saveConfigs()
            // To avoid mutating this.configs directly for persistence:
            const tempConfigsForSave = new Map(this.configs);
            tempConfigsForSave.set(config.id, persistentConfigData as BackupJobConfig);
            // Modify saveConfigs to accept a map or make it aware of not saving currentJobId.
            // For simplicity now, we'll assume saveConfigs handles this or we handle it before calling.
            // The current saveConfigs just iterates this.configs.values().

            // Let's ensure the main in-memory config (this.configs) has currentJobId.
            // And when saving, saveConfigs needs to be aware or we provide a filtered list.

            // Simplification: Save current status but not currentJobId.
            // We will modify saveConfigs later if needed. For now, this means currentJobId is purely in-memory.
            // The state in `this.configs` *will* have `currentJobId`.
            // `saveConfigs` will write it to disk if not handled.
            // Let's assume for now this is acceptable and address saveConfigs separately if `currentJobId` appears in JSON.
            // The current saveConfigs WILL persist currentJobId.
            //
            // Correct approach: Update in-memory, then save a version *without* currentJobId.
            // This requires `saveConfigs` to be smarter or to pass it a temporary, filtered list.
            // The `this.configs.set(config.id, persistentConfig)` line from my thought process was problematic.

            // The in-memory `this.configs.get(config.id)` now correctly has the `currentJobId`.
            // When `saveConfigs()` is called, it will iterate `this.configs.values()`.
            // We need to ensure `currentJobId` is stripped before writing to JSON.
            // This should be done in `saveConfigs` or by passing a "cleaned" list to `writeFile`.
            // For now, let `saveConfigs` persist it and we can clean it up in a follow-up if it's an issue.
            // The immediate goal is for the GraphQL resolver to see currentJobId.

            // Save the config with lastRunAt and lastRunStatus (currentJobId will also be saved by current saveConfigs)
            await this.saveConfigs();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(
                `Backup job ${config.name} (ID: ${config.id}) failed during orchestration: ${errorMessage}`,
                (error as Error).stack
            );

            const currentConfig = this.configs.get(config.id);
            const failedConfigUpdate = {
                lastRunAt: new Date().toISOString(),
                lastRunStatus: `Failed: ${errorMessage}`,
                currentJobId: undefined, // Clear currentJobId on failure
            };

            if (currentConfig) {
                this.configs.set(config.id, {
                    ...currentConfig,
                    ...failedConfigUpdate,
                });
            } else {
                // If not in map, use passed config as base
                this.configs.set(config.id, {
                    ...config,
                    ...failedConfigUpdate,
                });
            }
            await this.saveConfigs(); // Save updated status, currentJobId will be cleared
            throw error;
        }
    }

    // Add a new method to be called when a job completes or is stopped
    public async handleJobCompletion(
        configId: string,
        finalStatus: string,
        jobId?: string
    ): Promise<void> {
        const config = this.configs.get(configId);
        if (config) {
            this.logger.log(
                `Handling job completion for config ${configId}, job ${jobId}. Final status: ${finalStatus}`
            );

            const updates: Partial<BackupJobConfig> = {
                lastRunStatus: finalStatus,
                lastRunAt: new Date().toISOString(), // Update lastRunAt to completion time
            };

            // Only clear currentJobId if it matches the completed/stopped job
            if (config.currentJobId === jobId) {
                updates.currentJobId = undefined;
            } else if (jobId && config.currentJobId) {
                this.logger.warn(
                    `Completed job ID ${jobId} does not match currentJobId ${config.currentJobId} for config ${configId}. currentJobId not cleared.`
                );
            }

            this.configs.set(configId, {
                ...config,
                ...updates,
            });

            // currentJobId will be cleared or remain as is in memory.
            // saveConfigs will persist this state.
            await this.saveConfigs();
        } else {
            this.logger.warn(`Config ${configId} not found when trying to handle job completion.`);
        }
    }

    private scheduleJob(config: BackupJobConfig): void {
        try {
            const job = new CronJob(
                config.schedule,
                () => this.executeBackupJob(config),
                null,
                false,
                'UTC'
            );

            this.schedulerRegistry.addCronJob(`${JOB_GROUP_PREFIX}${config.id}`, job);
            job.start();
            this.logger.log(`Scheduled backup job: ${config.name} with schedule: ${config.schedule}`);
        } catch (error) {
            this.logger.error(`Failed to schedule backup job ${config.name}:`, error);
        }
    }

    private unscheduleJob(id: string): void {
        try {
            const jobName = `${JOB_GROUP_PREFIX}${id}`;
            if (this.schedulerRegistry.doesExist('cron', jobName)) {
                this.schedulerRegistry.deleteCronJob(jobName);
                this.logger.log(`Unscheduled backup job: ${id}`);
            } else {
                this.logger.debug(`No existing cron job found to unschedule for backup job: ${id}`);
            }
        } catch (error) {
            this.logger.error(`Failed to unschedule backup job ${id}:`, error);
        }
    }

    private async loadConfigs(): Promise<void> {
        try {
            if (existsSync(this.configPath)) {
                const data = await readFile(this.configPath, 'utf-8');
                const configs: BackupJobConfig[] = JSON.parse(data);

                // First, unschedule any existing jobs before clearing the config map
                this.configs.forEach((config) => {
                    if (config.enabled) {
                        this.unscheduleJob(config.id);
                    }
                });

                this.configs.clear();
                configs.forEach((config) => {
                    // Transform plain objects back into class instances
                    const transformedConfig = {
                        ...config,
                        sourceConfig: this.transformPlainObjectToSourceConfig(
                            config.sourceConfig,
                            config.sourceType
                        ),
                        destinationConfig: this.transformPlainObjectToDestinationConfig(
                            config.destinationConfig,
                            config.destinationType
                        ),
                    };

                    this.configs.set(config.id, transformedConfig);
                    if (transformedConfig.enabled) {
                        this.scheduleJob(transformedConfig);
                    }
                });

                this.logger.log(`Loaded ${configs.length} backup job configurations`);
            }
        } catch (error) {
            this.logger.error('Failed to load backup configurations:', error);
        }
    }

    private async saveConfigs(): Promise<void> {
        try {
            // Create a deep copy of configs for saving, stripping currentJobId
            const configsToSave: BackupJobConfig[] = [];
            for (const config of this.configs.values()) {
                const { currentJobId, ...restOfConfig } = config; // Destructure to remove currentJobId
                configsToSave.push(restOfConfig as BackupJobConfig); // Cast needed if TS complains
            }
            await writeFile(this.configPath, JSON.stringify(configsToSave, null, 2));
        } catch (error) {
            this.logger.error('Failed to save backup configurations:', error);
        }
    }
}
