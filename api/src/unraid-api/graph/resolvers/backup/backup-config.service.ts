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
import { BackupSourceResult } from '@app/unraid-api/graph/resolvers/backup/source/backup-source-processor.interface.js';
import {
    BackupSourceOptions,
    BackupSourceService,
} from '@app/unraid-api/graph/resolvers/backup/source/backup-source.service.js';
import { SourceType } from '@app/unraid-api/graph/resolvers/backup/source/backup-source.types.js';
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
        private readonly backupSourceService: BackupSourceService
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

        // Convert SourceConfigInput to SourceConfig if provided
        const sourceConfig = input.sourceConfig
            ? {
                  timeout: input.sourceConfig.timeout ?? 3600,
                  cleanupOnFailure: input.sourceConfig.cleanupOnFailure ?? true,
                  zfsConfig: input.sourceConfig.zfsConfig
                      ? {
                            poolName: input.sourceConfig.zfsConfig.poolName,
                            datasetName: input.sourceConfig.zfsConfig.datasetName,
                            snapshotPrefix: input.sourceConfig.zfsConfig.snapshotPrefix,
                            cleanupSnapshots: input.sourceConfig.zfsConfig.cleanupSnapshots,
                            retainSnapshots: input.sourceConfig.zfsConfig.retainSnapshots,
                        }
                      : undefined,
                  flashConfig: input.sourceConfig.flashConfig
                      ? {
                            flashPath: input.sourceConfig.flashConfig.flashPath,
                            includeGitHistory: input.sourceConfig.flashConfig.includeGitHistory,
                            additionalPaths: input.sourceConfig.flashConfig.additionalPaths,
                        }
                      : undefined,
                  scriptConfig: input.sourceConfig.scriptConfig
                      ? {
                            scriptPath: input.sourceConfig.scriptConfig.scriptPath,
                            scriptArgs: input.sourceConfig.scriptConfig.scriptArgs,
                            workingDirectory: input.sourceConfig.scriptConfig.workingDirectory,
                            environment: input.sourceConfig.scriptConfig.environment,
                            outputPath: input.sourceConfig.scriptConfig.outputPath,
                        }
                      : undefined,
                  rawConfig: input.sourceConfig.rawConfig
                      ? {
                            sourcePath: input.sourceConfig.rawConfig.sourcePath,
                            excludePatterns: input.sourceConfig.rawConfig.excludePatterns,
                            includePatterns: input.sourceConfig.rawConfig.includePatterns,
                        }
                      : undefined,
              }
            : undefined;

        const config: BackupJobConfig = {
            id,
            name: input.name,
            sourceType: input.sourceType,
            remoteName: input.remoteName,
            destinationPath: input.destinationPath,
            schedule: input.schedule || '0 2 * * *', // Default to 2 AM daily if not provided
            enabled: input.enabled,
            rcloneOptions: input.rcloneOptions,
            sourceConfig,
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

        // Convert SourceConfigInput to SourceConfig if provided
        const sourceConfig = input.sourceConfig
            ? {
                  timeout: input.sourceConfig.timeout ?? existing.sourceConfig?.timeout ?? 3600,
                  cleanupOnFailure:
                      input.sourceConfig.cleanupOnFailure ??
                      existing.sourceConfig?.cleanupOnFailure ??
                      true,
                  zfsConfig: input.sourceConfig.zfsConfig
                      ? {
                            poolName: input.sourceConfig.zfsConfig.poolName,
                            datasetName: input.sourceConfig.zfsConfig.datasetName,
                            snapshotPrefix: input.sourceConfig.zfsConfig.snapshotPrefix,
                            cleanupSnapshots: input.sourceConfig.zfsConfig.cleanupSnapshots,
                            retainSnapshots: input.sourceConfig.zfsConfig.retainSnapshots,
                        }
                      : existing.sourceConfig?.zfsConfig,
                  flashConfig: input.sourceConfig.flashConfig
                      ? {
                            flashPath: input.sourceConfig.flashConfig.flashPath,
                            includeGitHistory: input.sourceConfig.flashConfig.includeGitHistory,
                            additionalPaths: input.sourceConfig.flashConfig.additionalPaths,
                        }
                      : existing.sourceConfig?.flashConfig,
                  scriptConfig: input.sourceConfig.scriptConfig
                      ? {
                            scriptPath: input.sourceConfig.scriptConfig.scriptPath,
                            scriptArgs: input.sourceConfig.scriptConfig.scriptArgs,
                            workingDirectory: input.sourceConfig.scriptConfig.workingDirectory,
                            environment: input.sourceConfig.scriptConfig.environment,
                            outputPath: input.sourceConfig.scriptConfig.outputPath,
                        }
                      : existing.sourceConfig?.scriptConfig,
                  rawConfig: input.sourceConfig.rawConfig
                      ? {
                            sourcePath: input.sourceConfig.rawConfig.sourcePath,
                            excludePatterns: input.sourceConfig.rawConfig.excludePatterns,
                            includePatterns: input.sourceConfig.rawConfig.includePatterns,
                        }
                      : existing.sourceConfig?.rawConfig,
              }
            : existing.sourceConfig;

        const updated: BackupJobConfig = {
            ...existing,
            ...input,
            sourceConfig,
            updatedAt: new Date().toISOString(),
            // lastRunAt is already a string if provided in input
            lastRunAt: input.lastRunAt || existing.lastRunAt,
        };
        this.logger.debug(
            `[updateBackupJobConfig] Updated object for ID ${id} (before set): ${JSON.stringify(updated)}`
        );

        this.configs.set(id, updated);
        const immediatelyAfterSet = this.configs.get(id);
        this.logger.debug(
            `[updateBackupJobConfig] Config for ID ${id} (immediately after set): ${JSON.stringify(immediatelyAfterSet)}`
        );

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
        this.logger.log(`Executing backup job: ${config.name}`);

        try {
            let sourcePath = this.getSourcePath(config);
            let preprocessResult: BackupSourceResult | null = null;

            if (config.sourceConfig && config.sourceType !== SourceType.RAW) {
                this.logger.log(`Running preprocessing for job: ${config.name}`);

                const backupSourceOptions: BackupSourceOptions = {
                    jobId: config.id,
                    onProgress: (progress) => {
                        this.logger.debug(`Preprocessing progress for ${config.name}: ${progress}%`);
                    },
                    onOutput: (data) => {
                        this.logger.debug(`Preprocessing output for ${config.name}: ${data}`);
                    },
                    onError: (error) => {
                        this.logger.error(`Preprocessing error for ${config.name}: ${error}`);
                    },
                };

                preprocessResult = await this.backupSourceService.executeFromLegacyConfig(
                    config.sourceConfig,
                    backupSourceOptions
                );

                if (!preprocessResult.success) {
                    throw new Error(`Preprocessing failed: ${preprocessResult.error}`);
                }

                if (preprocessResult.streamPath) {
                    sourcePath = preprocessResult.streamPath;
                    this.logger.log(`Using streaming source for backup: ${sourcePath}`);
                } else if (preprocessResult.outputPath) {
                    sourcePath = preprocessResult.outputPath;
                    this.logger.log(`Using preprocessed output for backup: ${sourcePath}`);
                }
            }

            const isStreamingBackup =
                config.sourceType === SourceType.ZFS || config.sourceType === SourceType.FLASH;

            let result;
            if (isStreamingBackup && preprocessResult?.streamPath) {
                const streamingOptions = this.buildStreamingOptions(
                    config.sourceType,
                    preprocessResult.streamPath,
                    config.remoteName,
                    config.destinationPath
                );

                result =
                    await this.rcloneService['rcloneApiService'].startStreamingBackup(streamingOptions);
            } else {
                result = (await this.rcloneService['rcloneApiService'].startBackup({
                    srcPath: sourcePath,
                    dstPath: `${config.remoteName}:${config.destinationPath}`,
                    async: true,
                    configId: config.id,
                    options: config.rcloneOptions || {},
                })) as { jobId?: string; jobid?: string };
            }

            const jobId = result.jobId || result.jobid;

            const updatedConfig = {
                ...config,
                lastRunAt: new Date().toISOString(),
                lastRunStatus: `Started with job ID: ${jobId}`,
                currentJobId: jobId,
            };
            this.configs.set(config.id, updatedConfig);
            await this.saveConfigs();

            this.logger.log(`Backup job ${config.name} started successfully: ${jobId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const updatedConfig = {
                ...config,
                lastRunAt: new Date().toISOString(),
                lastRunStatus: `Failed: ${errorMessage}`,
                currentJobId: undefined,
            };
            this.configs.set(config.id, updatedConfig);
            await this.saveConfigs();

            this.logger.error(`Backup job ${config.name} failed:`, error);

            if (config.sourceConfig?.cleanupOnFailure) {
                try {
                    await this.backupSourceService.cleanup(config.id);
                } catch (cleanupError) {
                    this.logger.error(
                        `Failed to cleanup preprocessing for job ${config.name}:`,
                        cleanupError
                    );
                }
            }
        }
    }

    private getSourcePath(config: BackupJobConfig): string {
        // Extract source path based on backup type and configuration
        switch (config.sourceType) {
            case SourceType.ZFS:
                if (!config.sourceConfig?.zfsConfig) {
                    throw new Error('ZFS configuration is required for ZFS backups');
                }
                return config.sourceConfig.zfsConfig.poolName;
            case SourceType.FLASH:
                return config.sourceConfig?.flashConfig?.flashPath || '/boot';
            case SourceType.SCRIPT:
                return config.sourceConfig?.scriptConfig?.outputPath || '/tmp/script-output';
            case SourceType.RAW:
                return config.sourceConfig?.rawConfig?.sourcePath || '/';
            default:
                throw new Error(`Unsupported backup type: ${config.sourceType}`);
        }
    }

    private buildStreamingOptions(
        sourceType: SourceType,
        streamPath: string,
        remoteName: string,
        destinationPath: string
    ) {
        const options = {
            remoteName,
            remotePath: destinationPath,
            sourceType: sourceType,
        };

        switch (sourceType) {
            case SourceType.ZFS:
                return {
                    ...options,
                    sourceCommand: 'zfs',
                    sourceArgs: ['send', streamPath],
                    timeout: 3600000,
                };
            case SourceType.FLASH:
                return {
                    ...options,
                    sourceCommand: 'tar',
                    sourceArgs: ['cf', '-', streamPath],
                    timeout: 3600000,
                };
            default:
                throw new Error(`Unsupported streaming backup type: ${sourceType}`);
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

    addCronJob(name: string, seconds: string) {
        const job = new CronJob(`${seconds} * * * * *`, () => {
            this.logger.warn(`time (${seconds}) for job ${name} to run!`);
        });

        this.schedulerRegistry.addCronJob(name, job);
        job.start();

        this.logger.warn(`job ${name} added for each minute at ${seconds} seconds!`);
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
