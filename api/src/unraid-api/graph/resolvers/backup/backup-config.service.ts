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
import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';

const JOB_GROUP_PREFIX = 'backup-';

interface BackupJobConfigData {
    id: string;
    name: string;
    sourcePath: string;
    remoteName: string;
    destinationPath: string;
    schedule: string;
    enabled: boolean;
    rcloneOptions?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    lastRunAt?: string;
    lastRunStatus?: string;
    currentJobId?: string;
}

@Injectable()
export class BackupConfigService implements OnModuleInit {
    private readonly logger = new Logger(BackupConfigService.name);
    private readonly configPath: string;
    private configs: Map<string, BackupJobConfigData> = new Map();

    constructor(
        private readonly rcloneService: RCloneService,
        private readonly schedulerRegistry: SchedulerRegistry
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

        const config: BackupJobConfigData = {
            id,
            ...input,
            createdAt: now,
            updatedAt: now,
        };

        this.configs.set(id, config);
        await this.saveConfigs();

        if (config.enabled) {
            this.scheduleJob(config);
        }

        return this.mapToGraphQL(config);
    }

    async updateBackupJobConfig(
        id: string,
        input: UpdateBackupJobConfigInput
    ): Promise<BackupJobConfig | null> {
        const existing = this.configs.get(id);
        if (!existing) return null;

        const updated: BackupJobConfigData = {
            ...existing,
            ...input,
            updatedAt: new Date().toISOString(),
        };

        this.configs.set(id, updated);
        await this.saveConfigs();

        this.unscheduleJob(id);
        if (updated.enabled) {
            this.scheduleJob(updated);
        }

        return this.mapToGraphQL(updated);
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
        const config = this.configs.get(id);
        return config ? this.mapToGraphQL(config) : null;
    }

    async getAllBackupJobConfigs(): Promise<BackupJobConfig[]> {
        return Array.from(this.configs.values()).map((config) => this.mapToGraphQL(config));
    }

    private async executeBackupJob(config: BackupJobConfigData): Promise<void> {
        this.logger.log(`Executing backup job: ${config.name}`);

        try {
            const result = (await this.rcloneService['rcloneApiService'].startBackup({
                srcPath: config.sourcePath,
                dstPath: `${config.remoteName}:${config.destinationPath}`,
                async: true,
                configId: config.id,
                options: config.rcloneOptions || {},
            })) as { jobId?: string; jobid?: string };

            const jobId = result.jobId || result.jobid;

            config.lastRunAt = new Date().toISOString();
            config.lastRunStatus = `Started with job ID: ${jobId}`;
            config.currentJobId = jobId;
            this.configs.set(config.id, config);
            await this.saveConfigs();

            this.logger.log(`Backup job ${config.name} started successfully: ${jobId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            config.lastRunAt = new Date().toISOString();
            config.lastRunStatus = `Failed: ${errorMessage}`;
            config.currentJobId = undefined;
            this.configs.set(config.id, config);
            await this.saveConfigs();

            this.logger.error(`Backup job ${config.name} failed:`, error);
        }
    }

    private scheduleJob(config: BackupJobConfigData): void {
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
                const configs: BackupJobConfigData[] = JSON.parse(data);

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

    private mapToGraphQL(config: BackupJobConfigData): BackupJobConfig {
        return {
            id: config.id,
            name: config.name,
            sourcePath: config.sourcePath,
            remoteName: config.remoteName,
            destinationPath: config.destinationPath,
            schedule: config.schedule,
            enabled: config.enabled,
            rcloneOptions: config.rcloneOptions,
            createdAt: new Date(config.createdAt),
            updatedAt: new Date(config.updatedAt),
            lastRunAt: config.lastRunAt ? new Date(config.lastRunAt) : undefined,
            lastRunStatus: config.lastRunStatus,
            currentJobId: config.currentJobId,
        };
    }
}
