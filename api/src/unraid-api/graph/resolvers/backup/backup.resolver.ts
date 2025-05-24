import { Inject, Logger } from '@nestjs/common';
import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { BackupConfigService } from '@app/unraid-api/graph/resolvers/backup/backup-config.service.js';
import {
    Backup,
    BackupJob,
    BackupJobConfig,
    BackupJobConfigForm,
    BackupJobConfigFormInput,
    BackupStatus,
    CreateBackupJobConfigInput,
    InitiateBackupInput,
    UpdateBackupJobConfigInput,
} from '@app/unraid-api/graph/resolvers/backup/backup.model.js';
import { FormatService } from '@app/unraid-api/graph/resolvers/backup/format.service.js';
import { buildBackupJobConfigSchema } from '@app/unraid-api/graph/resolvers/backup/jsonforms/backup-jsonforms-config.js';
import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';

@Resolver(() => Backup)
export class BackupResolver {
    private readonly logger = new Logger(BackupResolver.name);

    constructor(
        private readonly rcloneService: RCloneService,
        private readonly backupConfigService: BackupConfigService,
        private readonly formatService: FormatService
    ) {}

    @Query(() => Backup, {
        description: 'Get backup service information',
    })
    async backup(): Promise<Backup> {
        return {
            id: 'backup',
            jobs: [],
            configs: [],
        };
    }

    @ResolveField(() => [BackupJob], {
        description: 'Get all running backup jobs',
    })
    async jobs(): Promise<BackupJob[]> {
        return this.backupJobs();
    }

    @ResolveField(() => [BackupJobConfig], {
        description: 'Get all backup job configurations',
    })
    async configs(): Promise<BackupJobConfig[]> {
        return this.backupConfigService.getAllBackupJobConfigs();
    }

    @Query(() => BackupJobConfig, {
        description: 'Get a specific backup job configuration',
        nullable: true,
    })
    async backupJobConfig(@Args('id') id: string): Promise<BackupJobConfig | null> {
        return this.backupConfigService.getBackupJobConfig(id);
    }

    @Mutation(() => BackupJobConfig, {
        description: 'Create a new backup job configuration',
    })
    async createBackupJobConfig(
        @Args('input') input: CreateBackupJobConfigInput
    ): Promise<BackupJobConfig> {
        return this.backupConfigService.createBackupJobConfig(input);
    }

    @Mutation(() => BackupJobConfig, {
        description: 'Update a backup job configuration',
        nullable: true,
    })
    async updateBackupJobConfig(
        @Args('id') id: string,
        @Args('input') input: UpdateBackupJobConfigInput
    ): Promise<BackupJobConfig | null> {
        return this.backupConfigService.updateBackupJobConfig(id, input);
    }

    @Mutation(() => Boolean, {
        description: 'Delete a backup job configuration',
    })
    async deleteBackupJobConfig(@Args('id') id: string): Promise<boolean> {
        return this.backupConfigService.deleteBackupJobConfig(id);
    }

    private async backupJobs(): Promise<BackupJob[]> {
        try {
            const jobs = await this.rcloneService['rcloneApiService'].listRunningJobs();
            return (
                jobs.jobids?.map((jobId: string, index: number) => {
                    const stats = jobs.stats?.[index] || {};
                    return {
                        id: jobId,
                        type: 'backup',
                        stats,
                        formattedBytes: stats.bytes
                            ? this.formatService.formatBytes(stats.bytes)
                            : undefined,
                        formattedSpeed: stats.speed
                            ? this.formatService.formatBytes(stats.speed)
                            : undefined,
                        formattedElapsedTime: stats.elapsedTime
                            ? this.formatService.formatDuration(stats.elapsedTime)
                            : undefined,
                        formattedEta: stats.eta
                            ? this.formatService.formatDuration(stats.eta)
                            : undefined,
                    };
                }) || []
            );
        } catch (error) {
            this.logger.error('Failed to fetch backup jobs:', error);
            return [];
        }
    }

    @Query(() => BackupJob, {
        description: 'Get status of a specific backup job',
        nullable: true,
    })
    async backupJob(@Args('jobId') jobId: string): Promise<BackupJob | null> {
        try {
            const status = await this.rcloneService['rcloneApiService'].getJobStatus({ jobId });
            return {
                id: jobId,
                type: status.group || 'backup',
                stats: status,
                formattedBytes: status.bytes ? this.formatService.formatBytes(status.bytes) : undefined,
                formattedSpeed: status.speed ? this.formatService.formatBytes(status.speed) : undefined,
                formattedElapsedTime: status.elapsedTime
                    ? this.formatService.formatDuration(status.elapsedTime)
                    : undefined,
                formattedEta: status.eta ? this.formatService.formatDuration(status.eta) : undefined,
            };
        } catch (error) {
            this.logger.error(`Failed to fetch backup job ${jobId}:`, error);
            return null;
        }
    }

    @Mutation(() => BackupStatus, {
        description: 'Initiates a backup using a configured remote.',
    })
    async initiateBackup(@Args('input') input: InitiateBackupInput): Promise<BackupStatus> {
        try {
            const result = await this.rcloneService['rcloneApiService'].startBackup({
                srcPath: input.sourcePath,
                dstPath: `${input.remoteName}:${input.destinationPath}`,
                options: input.options,
            });

            return {
                status: 'Backup initiated successfully',
                jobId: result.jobid || result.jobId,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Failed to initiate backup:', error);

            return {
                status: `Failed to initiate backup: ${errorMessage}`,
                jobId: undefined,
            };
        }
    }

    @ResolveField(() => BackupStatus, {
        description: 'Get the status for the backup service',
    })
    async status(): Promise<BackupStatus> {
        return {
            status: 'Available',
            jobId: undefined,
        };
    }

    @Query(() => BackupJobConfigForm, {
        description: 'Get the JSON schema for backup job configuration form',
    })
    async backupJobConfigForm(
        @Args('input', { nullable: true }) input?: BackupJobConfigFormInput
    ): Promise<BackupJobConfigForm> {
        const remoteNames = await this.rcloneService.getConfiguredRemotes();
        const showAdvanced = input?.showAdvanced ?? false;

        const { dataSchema, uiSchema } = buildBackupJobConfigSchema({
            remoteNames,
            showAdvanced,
        });

        return {
            id: 'backup-job-config-form',
            dataSchema,
            uiSchema,
        };
    }
}
