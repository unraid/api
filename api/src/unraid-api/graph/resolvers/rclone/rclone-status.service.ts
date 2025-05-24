import { Injectable, Logger } from '@nestjs/common';

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

        if (stats.bytes !== undefined && stats.bytes !== null) {
            enhancedStats.formattedBytes = this.formatService.formatBytes(stats.bytes);
        }

        if (stats.speed !== undefined && stats.speed !== null && stats.speed > 0) {
            enhancedStats.formattedSpeed = this.formatService.formatSpeed(stats.speed);
        }

        if (stats.elapsedTime !== undefined && stats.elapsedTime !== null) {
            enhancedStats.formattedElapsedTime = this.formatService.formatDuration(stats.elapsedTime);
        }

        if (stats.eta !== undefined && stats.eta !== null && stats.eta > 0) {
            enhancedStats.formattedEta = this.formatService.formatDuration(stats.eta);
        }

        return enhancedStats;
    }

    transformStatsToJob(jobId: string | number, stats: RCloneJobStats): RCloneJob {
        this.logger.debug(`Stats for job ${jobId}: %o`, stats);
        const group = stats.group || undefined;

        this.logger.debug(`Processing job ${jobId}: group="${group}", stats: ${JSON.stringify(stats)}`);

        return {
            id: String(jobId),
            group: group,
            stats,
            finished:
                stats.fatalError === false &&
                stats.transfers === (stats.totalTransfers || 0) &&
                (stats.totalTransfers || 0) > 0,
            success: stats.fatalError === false && (stats.errors || 0) === 0,
            error: stats.lastError || undefined,
            progressPercentage: stats.percentage,
            detailedStatus: stats.lastError
                ? 'Error'
                : stats.percentage === 100
                  ? 'Completed'
                  : 'Running',
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
