import { Inject, Logger } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';

import { pubsub } from '@app/core/pubsub.js';
import { BackupConfigService } from '@app/unraid-api/graph/resolvers/backup/backup-config.service.js';
import {
    Backup,
    BackupJobConfig,
    BackupJobConfigForm,
    BackupJobConfigFormInput,
    BackupStatus,
} from '@app/unraid-api/graph/resolvers/backup/backup.model.js';
import { buildBackupJobConfigSchema } from '@app/unraid-api/graph/resolvers/backup/jsonforms/backup-jsonforms-config.js';
import { RCloneJob, RCloneJobStatus } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';
import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';
import { FormatService } from '@app/unraid-api/utils/format.service.js';

const JOB_GROUP_PREFIX = 'backup-';

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

    @ResolveField(() => [RCloneJob], {
        description: 'Get all running jobs (filtering should be done on frontend)',
    })
    async jobs(): Promise<RCloneJob[]> {
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
    async backupJobConfig(
        @Args('id', { type: () => PrefixedID }) id: string
    ): Promise<BackupJobConfig | null> {
        return this.backupConfigService.getBackupJobConfig(id);
    }

    @Query(() => RCloneJob, {
        description: 'Get status of a specific backup job',
        nullable: true,
    })
    async backupJob(@Args('id', { type: () => PrefixedID }) id: string): Promise<RCloneJob | null> {
        return this.rcloneService.getEnhancedJobStatus(id);
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

    @Subscription(() => RCloneJob, {
        description: 'Subscribe to real-time backup job progress updates',
        nullable: true,
    })
    async backupJobProgress(@Args('id', { type: () => PrefixedID }) id: string) {
        return pubsub.asyncIterableIterator(`BACKUP_JOB_PROGRESS:${id}`);
    }

    private async backupJobs(): Promise<RCloneJob[]> {
        try {
            this.logger.debug('backupJobs called - returning all jobs for frontend filtering');

            const jobs = (await this.rcloneService['rcloneApiService'].getAllJobsWithStats()).filter(
                (job) => job.group?.startsWith(JOB_GROUP_PREFIX)
            );

            this.logger.debug(`Returning ${jobs.length} jobs total for frontend filtering`);

            return jobs;
        } catch (error) {
            this.logger.error('Failed to fetch backup jobs:', error);
            return [];
        }
    }
}

@Resolver(() => BackupJobConfig)
export class BackupJobConfigResolver {
    private readonly logger = new Logger(BackupJobConfigResolver.name);

    constructor(private readonly rcloneService: RCloneService) {}

    @ResolveField(() => RCloneJob, {
        description: 'Get the current running job for this backup config',
        nullable: true,
    })
    async currentJob(@Parent() config: BackupJobConfig): Promise<RCloneJob | null> {
        if (!config.currentJobId) {
            return null;
        }

        return this.rcloneService.getEnhancedJobStatus(config.currentJobId, config.id);
    }
}
