import { Inject, Logger } from '@nestjs/common';
import { Args, Mutation, Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';

import { pubsub } from '@app/core/pubsub.js';
import { BackupConfigService } from '@app/unraid-api/graph/resolvers/backup/backup-config.service.js';
import {
    Backup,
    BackupJob,
    BackupJobConfig,
    BackupJobConfigForm,
    BackupJobConfigFormInput,
    BackupStatus,
} from '@app/unraid-api/graph/resolvers/backup/backup.model.js';
import { FormatService } from '@app/unraid-api/graph/resolvers/backup/format.service.js';
import { buildBackupJobConfigSchema } from '@app/unraid-api/graph/resolvers/backup/jsonforms/backup-jsonforms-config.js';
import { RCloneJob } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';
import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';

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
    async jobs(
        @Args('showSystemJobs', { type: () => Boolean, nullable: true, defaultValue: false })
        showSystemJobs?: boolean
    ): Promise<BackupJob[]> {
        return this.backupJobs(showSystemJobs);
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

    @Query(() => BackupJob, {
        description: 'Get status of a specific backup job',
        nullable: true,
    })
    async backupJob(
        @Args('jobId', { type: () => PrefixedID }) jobId: string
    ): Promise<BackupJob | null> {
        try {
            const status = await this.rcloneService['rcloneApiService'].getJobStatus({ jobId });
            return {
                id: jobId,
                group: status.group || '',
                stats: status,
            };
        } catch (error) {
            this.logger.error(`Failed to fetch backup job ${jobId}:`, error);
            return null;
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

    @Subscription(() => BackupJob, {
        description: 'Subscribe to real-time backup job progress updates',
        nullable: true,
    })
    async backupJobProgress(@Args('jobId', { type: () => PrefixedID }) jobId: string) {
        return pubsub.asyncIterableIterator(`BACKUP_JOB_PROGRESS:${jobId}`);
    }

    private async backupJobs(showSystemJobs: boolean = false): Promise<RCloneJob[]> {
        try {
            this.logger.debug(`backupJobs called with showSystemJobs: ${showSystemJobs}`);

            let jobs;
            if (showSystemJobs) {
                // Get all jobs when showing system jobs
                jobs = await this.rcloneService['rcloneApiService'].getAllJobsWithStats();
                this.logger.debug(`All jobs with stats: ${JSON.stringify(jobs)}`);
            } else {
                // Get only backup jobs with enhanced stats when not showing system jobs
                jobs = await this.rcloneService['rcloneApiService'].getBackupJobsWithStats();
                this.logger.debug(`Backup jobs with enhanced stats: ${JSON.stringify(jobs)}`);
            }

            // Filter and map jobs
            const allJobs =
                jobs.jobids?.map((jobId: string | number, index: number) => {
                    const stats = jobs.stats?.[index] || {};
                    const group = stats.group || '';

                    this.logger.debug(
                        `Processing job ${jobId}: group="${group}", stats keys: [${Object.keys(stats).join(', ')}]`
                    );

                    return {
                        id: String(jobId),
                        group: group,
                        stats,
                    };
                }) || [];

            this.logger.debug(`Mapped ${allJobs.length} jobs total`);

            // Log all job groups for analysis
            const jobGroupSummary = allJobs.map((job) => ({ id: job.id, group: job.group }));
            this.logger.debug(`All job groups: ${JSON.stringify(jobGroupSummary)}`);

            // Filter based on showSystemJobs flag
            if (showSystemJobs) {
                this.logger.debug(`Returning all ${allJobs.length} jobs (showSystemJobs=true)`);
                return allJobs;
            } else {
                // When not showing system jobs, we already filtered to backup jobs in getBackupJobsWithStats
                // But let's double-check the filtering for safety
                const filteredJobs = allJobs.filter((job) => job.group.startsWith('backup/'));
                this.logger.debug(
                    `Filtered to ${filteredJobs.length} backup jobs (group starts with 'backup/')`
                );

                const nonBackupJobs = allJobs.filter((job) => !job.group.startsWith('backup/'));
                if (nonBackupJobs.length > 0) {
                    this.logger.debug(
                        `Excluded ${nonBackupJobs.length} non-backup jobs: ${JSON.stringify(nonBackupJobs.map((j) => ({ id: j.id, group: j.group })))}`
                    );
                }

                return filteredJobs;
            }
        } catch (error) {
            this.logger.error('Failed to fetch backup jobs:', error);
            return [];
        }
    }
}
