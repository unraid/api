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
import {
    BACKUP_JOB_GROUP_PREFIX,
    getBackupJobGroupId,
} from '@app/unraid-api/graph/resolvers/backup/backup.utils.js';
import { buildBackupJobConfigSchema } from '@app/unraid-api/graph/resolvers/backup/jsonforms/backup-jsonforms-config.js';
import {
    BackupJobStatus,
    JobStatus,
} from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-job-status.model.js';
import { BackupJobTrackingService } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-job-tracking.service.js';
import { RCloneJob } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';
import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';
import { FormatService } from '@app/unraid-api/utils/format.service.js';

@Resolver(() => Backup)
export class BackupResolver {
    private readonly logger = new Logger(BackupResolver.name);

    constructor(
        private readonly rcloneService: RCloneService,
        private readonly backupConfigService: BackupConfigService,
        private readonly formatService: FormatService,
        private readonly backupJobTrackingService: BackupJobTrackingService
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

    @ResolveField(() => [JobStatus], {
        description: 'Get all running backup jobs',
    })
    async jobs(): Promise<JobStatus[]> {
        return this.backupJobTrackingService.getAllJobStatuses();
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

    @Query(() => JobStatus, {
        description: 'Get status of a specific backup job',
        nullable: true,
    })
    async backupJob(@Args('id', { type: () => PrefixedID }) id: string): Promise<JobStatus | null> {
        return this.backupJobTrackingService.getJobStatus(id) || null;
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
        const remotes = await this.rcloneService.getRemoteDetails();

        const { dataSchema, uiSchema } = buildBackupJobConfigSchema({
            remotes,
        });

        return {
            id: 'backup-job-config-form',
            dataSchema,
            uiSchema,
        };
    }
}

@Resolver(() => BackupJobConfig)
export class BackupJobConfigResolver {
    private readonly logger = new Logger(BackupJobConfigResolver.name);

    constructor(private readonly backupJobTrackingService: BackupJobTrackingService) {}

    @ResolveField(() => JobStatus, {
        description: 'Get the current running job for this backup config',
        nullable: true,
    })
    async currentJob(@Parent() config: BackupJobConfig): Promise<JobStatus | null> {
        if (!config.currentJobId) {
            return null;
        }

        this.logger.debug(
            `Looking for current job for config ${config.id} using currentJobId: ${config.currentJobId}`
        );

        const jobStatus = this.backupJobTrackingService.getJobStatus(config.currentJobId);
        if (!jobStatus) {
            this.logger.debug(`No job status found for job ID: ${config.currentJobId}`);
            return null;
        }

        return jobStatus as JobStatus;
    }
}
