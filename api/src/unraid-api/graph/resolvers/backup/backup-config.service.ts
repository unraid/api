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
import { PreprocessingService } from '@app/unraid-api/graph/resolvers/backup/preprocessing/preprocessing.service.js';
import {
    BackupType,
    PreprocessResult,
} from '@app/unraid-api/graph/resolvers/backup/preprocessing/preprocessing.types.js';
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
        private readonly preprocessingService: PreprocessingService
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

        // Convert BackupConfigInput to BackupConfig if provided
        const backupConfig = input.backupConfig
            ? {
                  timeout: input.backupConfig.timeout ?? 3600,
                  cleanupOnFailure: input.backupConfig.cleanupOnFailure ?? true,
                  zfsConfig: input.backupConfig.zfsConfig
                      ? {
                            poolName: input.backupConfig.zfsConfig.poolName,
                            datasetName: input.backupConfig.zfsConfig.datasetName,
                            snapshotPrefix: input.backupConfig.zfsConfig.snapshotPrefix,
                            cleanupSnapshots: input.backupConfig.zfsConfig.cleanupSnapshots,
                            retainSnapshots: input.backupConfig.zfsConfig.retainSnapshots,
                        }
                      : undefined,
                  flashConfig: input.backupConfig.flashConfig
                      ? {
                            flashPath: input.backupConfig.flashConfig.flashPath,
                            includeGitHistory: input.backupConfig.flashConfig.includeGitHistory,
                            additionalPaths: input.backupConfig.flashConfig.additionalPaths,
                        }
                      : undefined,
                  scriptConfig: input.backupConfig.scriptConfig
                      ? {
                            scriptPath: input.backupConfig.scriptConfig.scriptPath,
                            scriptArgs: input.backupConfig.scriptConfig.scriptArgs,
                            workingDirectory: input.backupConfig.scriptConfig.workingDirectory,
                            environment: input.backupConfig.scriptConfig.environment,
                            outputPath: input.backupConfig.scriptConfig.outputPath,
                        }
                      : undefined,
                  rawConfig: input.backupConfig.rawConfig
                      ? {
                            sourcePath: input.backupConfig.rawConfig.sourcePath,
                            excludePatterns: input.backupConfig.rawConfig.excludePatterns,
                            includePatterns: input.backupConfig.rawConfig.includePatterns,
                        }
                      : undefined,
              }
            : undefined;

        const config: BackupJobConfig = {
            id,
            name: input.name,
            backupType: input.backupType,
            remoteName: input.remoteName,
            destinationPath: input.destinationPath,
            schedule: input.schedule || '0 2 * * *', // Default to 2 AM daily if not provided
            enabled: input.enabled,
            rcloneOptions: input.rcloneOptions,
            backupConfig,
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

        // Convert BackupConfigInput to BackupConfig if provided
        const backupConfig = input.backupConfig
            ? {
                  timeout: input.backupConfig.timeout ?? existing.backupConfig?.timeout ?? 3600,
                  cleanupOnFailure:
                      input.backupConfig.cleanupOnFailure ??
                      existing.backupConfig?.cleanupOnFailure ??
                      true,
                  zfsConfig: input.backupConfig.zfsConfig
                      ? {
                            poolName: input.backupConfig.zfsConfig.poolName,
                            datasetName: input.backupConfig.zfsConfig.datasetName,
                            snapshotPrefix: input.backupConfig.zfsConfig.snapshotPrefix,
                            cleanupSnapshots: input.backupConfig.zfsConfig.cleanupSnapshots,
                            retainSnapshots: input.backupConfig.zfsConfig.retainSnapshots,
                        }
                      : existing.backupConfig?.zfsConfig,
                  flashConfig: input.backupConfig.flashConfig
                      ? {
                            flashPath: input.backupConfig.flashConfig.flashPath,
                            includeGitHistory: input.backupConfig.flashConfig.includeGitHistory,
                            additionalPaths: input.backupConfig.flashConfig.additionalPaths,
                        }
                      : existing.backupConfig?.flashConfig,
                  scriptConfig: input.backupConfig.scriptConfig
                      ? {
                            scriptPath: input.backupConfig.scriptConfig.scriptPath,
                            scriptArgs: input.backupConfig.scriptConfig.scriptArgs,
                            workingDirectory: input.backupConfig.scriptConfig.workingDirectory,
                            environment: input.backupConfig.scriptConfig.environment,
                            outputPath: input.backupConfig.scriptConfig.outputPath,
                        }
                      : existing.backupConfig?.scriptConfig,
                  rawConfig: input.backupConfig.rawConfig
                      ? {
                            sourcePath: input.backupConfig.rawConfig.sourcePath,
                            excludePatterns: input.backupConfig.rawConfig.excludePatterns,
                            includePatterns: input.backupConfig.rawConfig.includePatterns,
                        }
                      : existing.backupConfig?.rawConfig,
              }
            : existing.backupConfig;

        const updated: BackupJobConfig = {
            ...existing,
            ...input,
            backupConfig,
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
            let preprocessResult: PreprocessResult | null = null;

            if (config.backupConfig && config.backupType !== BackupType.RAW) {
                this.logger.log(`Running preprocessing for job: ${config.name}`);

                preprocessResult = await this.preprocessingService.executePreprocessing(
                    config.backupConfig,
                    {
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
                    }
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
                preprocessResult?.streamPath &&
                (config.backupType === BackupType.ZFS || config.backupType === BackupType.FLASH);

            let result;
            if (isStreamingBackup && preprocessResult?.streamPath) {
                const streamingOptions = this.buildStreamingOptions(
                    config.backupType,
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

            if (config.backupConfig?.cleanupOnFailure) {
                try {
                    await this.preprocessingService.cleanup(config.id);
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
        switch (config.backupType) {
            case BackupType.ZFS:
                return (
                    config.backupConfig?.zfsConfig?.poolName +
                        '/' +
                        config.backupConfig?.zfsConfig?.datasetName || ''
                );
            case BackupType.FLASH:
                return config.backupConfig?.flashConfig?.flashPath || '/boot';
            case BackupType.SCRIPT:
                return config.backupConfig?.scriptConfig?.outputPath || '';
            case BackupType.RAW:
                return config.backupConfig?.rawConfig?.sourcePath || '';
            default:
                return '';
        }
    }

    private buildStreamingOptions(
        backupType: BackupType,
        streamPath: string,
        remoteName: string,
        destinationPath: string
    ) {
        switch (backupType) {
            case BackupType.ZFS:
                return {
                    remoteName,
                    remotePath: destinationPath,
                    sourceCommand: 'zfs',
                    sourceArgs: ['send', streamPath],
                    preprocessType: backupType,
                    timeout: 3600000,
                };
            case BackupType.FLASH:
                return {
                    remoteName,
                    remotePath: destinationPath,
                    sourceCommand: 'tar',
                    sourceArgs: ['cf', '-', streamPath],
                    preprocessType: backupType,
                    timeout: 3600000,
                };
            default:
                throw new Error(`Unsupported streaming backup type: ${backupType}`);
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
