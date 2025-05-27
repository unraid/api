import { Args, Query, Resolver } from '@nestjs/graphql';

import { JobStatus } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-job-status.model.js';
import { BackupJobTrackingService } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-job-tracking.service.js';
import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';

@Resolver(() => JobStatus)
export class BackupJobStatusResolver {
    constructor(private readonly jobTrackingService: BackupJobTrackingService) {}

    @Query(() => JobStatus, { name: 'backupJobStatus', nullable: true })
    async getJobStatus(
        @Args('jobId', { type: () => PrefixedID }) jobId: string
    ): Promise<JobStatus | null> {
        const jobStatus = this.jobTrackingService.getJobStatus(jobId);
        if (!jobStatus) {
            // Optionally throw NotFoundException or return null based on desired API behavior
            // throw new NotFoundException(`Job with ID ${jobId} not found.`);
            return null;
        }
        return jobStatus as JobStatus; // Map JobStatusInfo to JobStatusGQL if necessary
    }

    @Query(() => [JobStatus], { name: 'allBackupJobStatuses' })
    async getAllJobStatuses(): Promise<JobStatus[]> {
        const statuses = this.jobTrackingService.getAllJobStatuses();
        return statuses as JobStatus[]; // Map JobStatusInfo[] to JobStatusGQL[] if necessary
    }
}
