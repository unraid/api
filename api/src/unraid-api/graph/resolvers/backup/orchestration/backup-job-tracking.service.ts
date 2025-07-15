import { Injectable, Logger } from '@nestjs/common';

import {
    BackupJobStatus,
    JobStatus,
} from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-job-status.model.js';

@Injectable()
export class BackupJobTrackingService {
    private readonly logger = new Logger(BackupJobTrackingService.name);
    private activeJobs: Map<string, JobStatus> = new Map(); // Maps internal ID -> JobStatus
    private externalJobIndex: Map<string, string> = new Map(); // Maps external ID -> internal ID

    constructor() {
        // Potentially load persisted jobs if needed
    }

    initializeJob(externalJobId: string, jobName: string): JobStatus {
        // Check if external job already exists
        const existingInternalId = this.externalJobIndex.get(externalJobId);
        if (existingInternalId && this.activeJobs.has(existingInternalId)) {
            this.logger.warn(`Job with external ID ${externalJobId} is already initialized.`);
            return this.activeJobs.get(existingInternalId)!;
        }

        const internalId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newJobStatus: JobStatus = {
            id: internalId,
            externalJobId,
            name: jobName,
            status: BackupJobStatus.QUEUED,
            progress: 0,
            startTime: new Date(),
            message: 'Job initialized.',
        };

        this.activeJobs.set(internalId, newJobStatus);
        this.externalJobIndex.set(externalJobId, internalId);
        this.logger.log(
            `Job initialized: ${jobName} (Internal ID: ${internalId}, External ID: ${externalJobId})`
        );
        return newJobStatus;
    }

    updateJobStatus(
        internalId: string,
        updates: Partial<Omit<JobStatus, 'externalJobId' | 'startTime' | 'name' | 'id'>>
    ): JobStatus | null {
        const job = this.activeJobs.get(internalId);
        if (!job) {
            this.logger.warn(`Cannot update status for unknown internal job ID: ${internalId}`);
            return null;
        }

        const updatedJob = { ...job, ...updates };

        if (
            updates.status === BackupJobStatus.COMPLETED ||
            updates.status === BackupJobStatus.FAILED ||
            updates.status === BackupJobStatus.CANCELLED
        ) {
            updatedJob.endTime = new Date();
            updatedJob.progress = updates.status === BackupJobStatus.COMPLETED ? 100 : job.progress;
        }

        if (updatedJob.progress > 100) {
            updatedJob.progress = 100;
        }

        this.activeJobs.set(internalId, updatedJob);
        this.logger.log(
            `Job status updated for ${job.name} (Internal ID: ${internalId}): Status: ${updatedJob.status}, Progress: ${updatedJob.progress}%`
        );
        return updatedJob;
    }

    // For external systems (like RClone) to update job status
    updateJobStatusByExternalId(
        externalJobId: string,
        updates: Partial<Omit<JobStatus, 'externalJobId' | 'startTime' | 'name' | 'id'>>
    ): JobStatus | null {
        const internalId = this.externalJobIndex.get(externalJobId);
        if (!internalId) {
            this.logger.warn(`Cannot find internal job for external ID: ${externalJobId}`);
            return null;
        }
        return this.updateJobStatus(internalId, updates);
    }

    getJobStatus(internalId: string): JobStatus | undefined {
        return this.activeJobs.get(internalId);
    }

    getJobStatusByExternalId(externalJobId: string): JobStatus | undefined {
        const internalId = this.externalJobIndex.get(externalJobId);
        return internalId ? this.activeJobs.get(internalId) : undefined;
    }

    getAllJobStatuses(): JobStatus[] {
        return Array.from(this.activeJobs.values());
    }

    clearJob(internalId: string): boolean {
        const job = this.activeJobs.get(internalId);
        if (job) {
            this.externalJobIndex.delete(job.externalJobId);
        }
        return this.activeJobs.delete(internalId);
    }

    clearJobByExternalId(externalJobId: string): boolean {
        const internalId = this.externalJobIndex.get(externalJobId);
        if (internalId) {
            this.externalJobIndex.delete(externalJobId);
            return this.activeJobs.delete(internalId);
        }
        return false;
    }
}
