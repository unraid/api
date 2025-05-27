import { Injectable, Logger } from '@nestjs/common';

import { BackupJobStatus } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-job-status.model.js';
import {
    RCloneJob,
    RCloneJobListResponse,
    RCloneJobStats,
    RCloneJobWithStats,
} from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { FormatService } from '@app/unraid-api/utils/format.service.js';

// Internal interface for job status response from RClone API
interface RCloneJobStatusResponse {
    id?: string | number;
    group?: string;
    stats?: RCloneJobStats;
    finished?: boolean;
    error?: string;
    [key: string]: any;
}

interface BackupStatusResult {
    isRunning: boolean;
    stats: RCloneJobStats | null;
    jobCount: number;
    activeJobs: RCloneJobStatusResponse[];
}

@Injectable()
export class RCloneStatusService {
    private readonly logger = new Logger(RCloneStatusService.name);

    constructor(private readonly formatService: FormatService) {}

    enhanceStatsWithFormattedFields(stats: RCloneJobStats): RCloneJobStats {
        const enhancedStats = { ...stats };

        const isFinished =
            stats.fatalError === false &&
            stats.transfers === (stats.totalTransfers || 0) &&
            (stats.totalTransfers || 0) > 0;

        // Format bytes
        if (stats.bytes !== undefined && stats.bytes !== null) {
            enhancedStats.formattedBytes = this.formatService.formatBytes(stats.bytes);
        }

        // Handle speed formatting and reset for finished jobs
        if (isFinished && stats.speed !== undefined && stats.speed !== null) {
            enhancedStats.speed = 0;
        }

        if (stats.speed !== undefined && stats.speed !== null && stats.speed > 0) {
            enhancedStats.formattedSpeed = this.formatService.formatSpeed(stats.speed);
        } else {
            enhancedStats.formattedSpeed = '0 B/s';
        }

        // Format elapsed time
        if (stats.elapsedTime !== undefined && stats.elapsedTime !== null) {
            enhancedStats.formattedElapsedTime = this.formatService.formatDuration(stats.elapsedTime);
        } else {
            enhancedStats.formattedElapsedTime = '0s';
        }

        // Format ETA
        if (stats.eta !== undefined && stats.eta !== null && stats.eta > 0) {
            enhancedStats.formattedEta = this.formatService.formatDuration(stats.eta);
        } else {
            enhancedStats.formattedEta = 'Unknown';
        }

        // Calculate percentage fallback (what frontend currently does)
        let calculatedPercentage = stats.percentage;
        if (calculatedPercentage === null || calculatedPercentage === undefined) {
            if (stats.bytes && stats.totalBytes && stats.totalBytes > 0) {
                calculatedPercentage = Math.round((stats.bytes / stats.totalBytes) * 100);
            }
        }

        // For completed jobs, ensure percentage is 100
        if (isFinished && calculatedPercentage !== null && calculatedPercentage !== undefined) {
            calculatedPercentage = 100;
        }

        enhancedStats.calculatedPercentage = Math.round(calculatedPercentage || 0);

        // Determine if actively running (what frontend currently calculates)
        const isActivelyTransferring =
            stats.transferring && Array.isArray(stats.transferring) && stats.transferring.length > 0;
        const isActivelyChecking =
            stats.checking && Array.isArray(stats.checking) && stats.checking.length > 0;
        const hasActiveSpeed = (stats.speed || 0) > 0;
        const isNotFinished = !isFinished && stats.fatalError !== true;

        enhancedStats.isActivelyRunning =
            (isActivelyTransferring || isActivelyChecking || hasActiveSpeed) && isNotFinished;
        enhancedStats.isCompleted = isFinished;

        return enhancedStats;
    }

    transformStatsToJob(jobId: string | number, stats: RCloneJobStats): RCloneJob {
        this.logger.debug(`Stats for job ${jobId}: %o`, stats);
        const group = stats.group || undefined;

        this.logger.debug(`Processing job ${jobId}: group="${group}"`);

        const isFinished =
            stats.fatalError === false &&
            stats.transfers === (stats.totalTransfers || 0) &&
            (stats.totalTransfers || 0) > 0;

        const hasError = Boolean(stats.lastError);
        const isCancelled = stats.lastError === 'context canceled';

        // Determine status
        let status: BackupJobStatus;

        if (hasError) {
            if (isCancelled) {
                status = BackupJobStatus.CANCELLED;
            } else {
                status = BackupJobStatus.FAILED;
            }
        } else if (isFinished || stats.calculatedPercentage === 100) {
            status = BackupJobStatus.COMPLETED;
        } else {
            status = BackupJobStatus.RUNNING;
        }

        return {
            id: String(jobId),
            group: group,
            stats,
            finished: isFinished,
            success: stats.fatalError === false && (stats.errors || 0) === 0,
            error: stats.lastError || undefined,
            progressPercentage: stats.calculatedPercentage || stats.percentage,
            status,
            hasRecentJob: true, // If we have a job object, there's a recent job
        };
    }

    calculateCombinedStats(activeJobs: RCloneJobStatusResponse[]): RCloneJobStats | null {
        if (activeJobs.length === 0) return null;

        const validStats = activeJobs
            .map((job) => job.stats)
            .filter((stats): stats is RCloneJobStats => Boolean(stats));

        if (validStats.length === 0) return null;

        return validStats.reduce(
            (combined, stats) => ({
                bytes: (combined.bytes || 0) + (stats.bytes || 0),
                checks: (combined.checks || 0) + (stats.checks || 0),
                transfers: (combined.transfers || 0) + (stats.transfers || 0),
                totalBytes: (combined.totalBytes || 0) + (stats.totalBytes || 0),
                totalChecks: (combined.totalChecks || 0) + (stats.totalChecks || 0),
                totalTransfers: (combined.totalTransfers || 0) + (stats.totalTransfers || 0),
                speed: Math.max(combined.speed || 0, stats.speed || 0),
                eta: Math.max(combined.eta || 0, stats.eta || 0),
            }),
            {} as RCloneJobStats
        );
    }

    parseActiveJobs(
        jobStatuses: PromiseSettledResult<RCloneJobStatusResponse>[]
    ): RCloneJobStatusResponse[] {
        const activeJobs: RCloneJobStatusResponse[] = [];

        this.logger.debug(`Job statuses: ${JSON.stringify(jobStatuses)}`);

        jobStatuses.forEach((result, index) => {
            if (result.status === 'fulfilled' && !result.value.finished) {
                activeJobs.push(result.value);
            } else if (result.status === 'rejected') {
                this.logger.warn(`Failed to get status for job ${index}: ${result.reason}`);
            }
        });

        return activeJobs;
    }

    parseBackupStatus(
        runningJobs: RCloneJobListResponse,
        jobStatuses: PromiseSettledResult<RCloneJobStatusResponse>[]
    ): BackupStatusResult {
        if (!runningJobs.jobids?.length) {
            return {
                isRunning: false,
                stats: null,
                jobCount: 0,
                activeJobs: [],
            };
        }

        const activeJobs = this.parseActiveJobs(jobStatuses);
        const combinedStats = this.calculateCombinedStats(activeJobs);

        return {
            isRunning: activeJobs.length > 0,
            stats: combinedStats,
            jobCount: activeJobs.length,
            activeJobs,
        };
    }

    parseJobWithStats(jobId: string, jobStatus: RCloneJobStatusResponse): RCloneJob {
        const stats = jobStatus.stats ? this.enhanceStatsWithFormattedFields(jobStatus.stats) : {};
        return this.transformStatsToJob(jobId, stats);
    }

    parseAllJobsWithStats(runningJobs: RCloneJobListResponse, jobs: RCloneJob[]): RCloneJob[] {
        if (!runningJobs.jobids?.length) {
            this.logger.log('No active jobs found in RClone');
            return [];
        }

        this.logger.log(
            `Found ${runningJobs.jobids.length} active jobs in RClone: [${runningJobs.jobids.join(', ')}]`
        );

        return jobs;
    }

    parseJobsWithStats(jobStatuses: PromiseSettledResult<RCloneJobStatusResponse>[]): RCloneJob[] {
        const allJobs: RCloneJob[] = [];

        jobStatuses.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const jobStatus = result.value;
                const stats = jobStatus.stats
                    ? this.enhanceStatsWithFormattedFields(jobStatus.stats)
                    : {};
                const job = this.transformStatsToJob(jobStatus.id || index, stats);
                allJobs.push(job);
            } else {
                this.logger.error(`Failed to get status for job ${index}: ${result.reason}`);
            }
        });

        return allJobs;
    }

    getBackupStatus(): {
        isRunning: boolean;
        stats: RCloneJobStats | null;
        jobCount: number;
    } {
        try {
            return {
                isRunning: false,
                stats: null,
                jobCount: 0,
            };
        } catch (error) {
            this.logger.debug(`Error getting backup status: ${error}`);
            return {
                isRunning: false,
                stats: null,
                jobCount: 0,
            };
        }
    }
}
