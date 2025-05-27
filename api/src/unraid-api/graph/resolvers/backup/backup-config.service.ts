import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
import { BackupOrchestrationService } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-orchestration.service.js';
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
        private readonly backupOrchestrationService: BackupOrchestrationService
    ) {
        const paths = getters.paths();
        this.configPath = join(paths.backupBase, 'backup-jobs.json');
    }

    async onModuleInit(): Promise<void> {
        await this.loadConfigs();
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
        // Assuming the 'type' field exists on these input objects as per model definitions
        const sourceType = (input.sourceConfig as any).type; // e.g., SourceType.RAW, SourceType.ZFS
        const destinationType = (input.destinationConfig as any).type; // e.g., DestinationType.RCLONE

        if (!sourceType) {
            this.logger.error("Source configuration must include a valid 'type' property.");
            throw new Error("Source configuration must include a valid 'type' property.");
        }
        if (!destinationType) {
            this.logger.error("Destination configuration must include a valid 'type' property.");
            throw new Error("Destination configuration must include a valid 'type' property.");
        }

        const config: BackupJobConfig = {
            id,
            name: input.name,
            sourceType, // Derived from input.sourceConfig.type
            destinationType, // Derived from input.destinationConfig.type
            schedule: input.schedule || '0 2 * * *', // Default schedule
            enabled: input.enabled,
            sourceConfig: input.sourceConfig as any, // Assign directly from input
            destinationConfig: input.destinationConfig as any, // Assign directly from input
            createdAt: now,
            updatedAt: now,
            // Ensure all other required fields of BackupJobConfig from backup.model.ts are present
            // For example, Node interface fields if not automatically handled by spread or similar
            // lastRunAt, lastRunStatus, currentJobId, currentJob would be undefined initially
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
        if (input.sourceConfig) {
            const inputSourceType = (input.sourceConfig as any).type;
            if (!inputSourceType) {
                this.logger.warn(
                    `[updateBackupJobConfig] Source config update for ID ${id} is missing 'type'. Update skipped for sourceConfig.`
                );
            } else if (existing.sourceType !== inputSourceType) {
                // If type changes, replace the whole sourceConfig
                updatedSourceConfig = input.sourceConfig;
                this.logger.debug(
                    `[updateBackupJobConfig] Source type changed for ${id}. Replacing sourceConfig.`
                );
            } else {
                // If type is the same, merge. Create a deep merge if necessary, or handle per type.
                // For simplicity, a shallow merge is shown here. Real implementation might need smarter merging.
                updatedSourceConfig = { ...existing.sourceConfig, ...input.sourceConfig };
                this.logger.debug(`[updateBackupJobConfig] Merging sourceConfig for ${id}.`);
            }
        }

        // Handle destinationConfig update
        let updatedDestinationConfig = existing.destinationConfig;
        if (input.destinationConfig) {
            const inputDestinationType = (input.destinationConfig as any).type;
            if (!inputDestinationType) {
                this.logger.warn(
                    `[updateBackupJobConfig] Destination config update for ID ${id} is missing 'type'. Update skipped for destinationConfig.`
                );
            } else if (existing.destinationType !== inputDestinationType) {
                // If type changes, replace the whole destinationConfig
                updatedDestinationConfig = input.destinationConfig;
                this.logger.debug(
                    `[updateBackupJobConfig] Destination type changed for ${id}. Replacing destinationConfig.`
                );
            } else {
                // If type is the same, merge. Similar to sourceConfig, careful merging needed.
                updatedDestinationConfig = { ...existing.destinationConfig, ...input.destinationConfig };
                this.logger.debug(`[updateBackupJobConfig] Merging destinationConfig for ${id}.`);
            }
        }

        const updated: BackupJobConfig = {
            ...existing,
            name: input.name ?? existing.name,
            schedule: input.schedule ?? existing.schedule,
            enabled: input.enabled ?? existing.enabled,
            sourceType: (updatedSourceConfig as any)?.type ?? existing.sourceType,
            destinationType: (updatedDestinationConfig as any)?.type ?? existing.destinationType,
            sourceConfig: updatedSourceConfig,
            destinationConfig: updatedDestinationConfig,
            updatedAt: new Date().toISOString(),
            lastRunAt: input.lastRunAt !== undefined ? input.lastRunAt : existing.lastRunAt,
            lastRunStatus:
                input.lastRunStatus !== undefined ? input.lastRunStatus : existing.lastRunStatus,
            // currentJob is an object, typically not updated via this input directly
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

    private async executeBackupJob(config: BackupJobConfig): Promise<void> {
        this.logger.log(
            `Executing backup job via BackupOrchestrationService: ${config.name} (ID: ${config.id})`
        );

        // Update config to reflect that the job is starting
        const startingConfig = {
            ...config,
            lastRunAt: new Date().toISOString(),
            lastRunStatus: 'Starting...', // Orchestration service will provide more detailed status
        };
        this.configs.set(config.id, startingConfig);
        await this.saveConfigs();

        try {
            // Delegate to the BackupOrchestrationService
            await this.backupOrchestrationService.executeBackupJob(config, config.id);

            // Orchestration service handles its own status updates via StreamingJobManagerService.
            // We might fetch the final status from StreamingJobManagerService or rely on events if needed here.
            // For now, we'll assume success if no error is thrown.
            // The 'lastRunStatus' will be updated by the orchestration service through its lifecycle.
            // We could potentially update it here to 'Completed' as a fallback if needed,
            // but it's better to let the orchestration service be the source of truth for job status.
            this.logger.log(
                `Backup job ${config.name} (ID: ${config.id}) processing initiated by BackupOrchestrationService.`
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(
                `Backup job ${config.name} (ID: ${config.id}) failed during orchestration: ${errorMessage}`,
                (error as Error).stack
            );

            // Update config to reflect failure status
            // The orchestration service should ideally set the final failed status via StreamingJobManagerService.
            // This update is a fallback or general marker in the config itself.
            const failedConfig = {
                ...config, // Use original config to avoid partial updates from 'startingConfig' if not desired
                lastRunAt: new Date().toISOString(),
                lastRunStatus: `Failed: ${errorMessage}`,
            };
            this.configs.set(config.id, failedConfig);
            await this.saveConfigs();
            // Re-throw the error so the scheduler or caller can be aware
            throw error;
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
                    this.configs.set(config.id, config);
                    if (config.enabled) {
                        this.scheduleJob(config);
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
            const configs = Array.from(this.configs.values());
            await writeFile(this.configPath, JSON.stringify(configs, null, 2));
        } catch (error) {
            this.logger.error('Failed to save backup configurations:', error);
        }
    }
}
