import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import crypto from 'crypto';
import { ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { convert } from 'convert';
import { execa } from 'execa';
import got, { HTTPError } from 'got';
import pRetry from 'p-retry';

import { sanitizeParams } from '@app/core/log.js';
import {
    BACKUP_JOB_GROUP_PREFIX,
    getBackupJobGroupId,
    getConfigIdFromGroupId,
    isBackupJobGroup,
} from '@app/unraid-api/graph/resolvers/backup/backup.utils.js';
import { BackupJobStatus } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-job-status.model.js';
import { SourceType } from '@app/unraid-api/graph/resolvers/backup/source/backup-source.types.js';
import { RCloneStatusService } from '@app/unraid-api/graph/resolvers/rclone/rclone-status.service.js';
import {
    CreateRCloneRemoteDto,
    DeleteRCloneRemoteDto,
    GetRCloneJobStatusDto,
    GetRCloneRemoteConfigDto,
    GetRCloneRemoteDetailsDto,
    RCloneJob,
    RCloneJobListResponse,
    RCloneJobStats,
    RCloneProviderResponse,
    RCloneRemoteConfig,
    RCloneStartBackupInput,
    UpdateRCloneRemoteDto,
} from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { validateObject } from '@app/unraid-api/graph/resolvers/validation.utils.js';

// Constants for the service
const CONSTANTS = {
    LOG_LEVEL: {
        DEBUG: 'DEBUG',
        INFO: 'INFO',
    },
    RETRY_CONFIG: {
        retries: 10,
        minTimeout: 100,
        maxTimeout: 1000,
    },
    TIMEOUTS: {
        GRACEFUL_SHUTDOWN: 2000,
        PROCESS_CLEANUP: 1000,
    },
};

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

interface JobOperationResult {
    stopped: string[];
    forgotten?: string[];
    errors: string[];
}

@Injectable()
export class RCloneApiService implements OnModuleInit, OnModuleDestroy {
    private isInitialized: boolean = false;
    private readonly logger = new Logger(RCloneApiService.name);
    private rcloneSocketPath: string = '';
    private rcloneBaseUrl: string = '';
    private rcloneProcess: ChildProcess | null = null;
    private readonly rcloneUsername: string = crypto.randomBytes(12).toString('hex');
    private readonly rclonePassword: string = crypto.randomBytes(24).toString('hex');

    constructor(private readonly statusService: RCloneStatusService) {}

    async onModuleInit(): Promise<void> {
        try {
            await this.initializeRCloneService();
        } catch (error: unknown) {
            this.logger.error(`Error initializing RCloneApiService: ${error}`);
            this.isInitialized = false;
        }
    }

    async onModuleDestroy(): Promise<void> {
        await this.stopRcloneSocket();
        this.logger.log('RCloneApiService module destroyed');
    }

    private async initializeRCloneService(): Promise<void> {
        const { getters } = await import('@app/store/index.js');
        this.rcloneSocketPath = getters.paths()['rclone-socket'];
        const logFilePath = join(getters.paths()['log-base'], 'rclone-unraid-api.log');

        this.rcloneBaseUrl = `http://unix:${this.rcloneSocketPath}:`;
        this.logger.log(
            `Ensuring RClone is stopped and socket is clean before initialization. Socket path: ${this.rcloneSocketPath}`
        );

        // Stop any existing rclone instances and remove the socket file.
        await this.stopRcloneSocket();

        this.logger.warn('Proceeding to start new RClone socket...');
        this.isInitialized = await this.startRcloneSocket(this.rcloneSocketPath, logFilePath);
    }

    private async startRcloneSocket(socketPath: string, logFilePath: string): Promise<boolean> {
        try {
            await this.ensureLogFileExists(logFilePath);

            const rcloneArgs = this.buildRcloneArgs(socketPath, logFilePath);
            this.logger.log(`Starting RClone RC daemon on socket: ${socketPath}`);

            const rcloneProcessExecution = execa('rclone', rcloneArgs, { detached: false });
            this.rcloneProcess = rcloneProcessExecution;
            this.setupProcessListeners();

            rcloneProcessExecution.catch((error) => {
                this.logger.debug(
                    `Rclone process execution promise rejected (expected if process failed to start or exited prematurely): ${
                        error.shortMessage || error.message
                    }`
                );
            });

            await this.waitForSocketReady();
            this.logger.log('RClone RC daemon started and socket is ready.');
            return true;
        } catch (error: unknown) {
            this.logger.error(`Error during RClone RC daemon startup sequence: ${error}`);
            this.cleanupFailedProcess();
            return false;
        }
    }

    private async ensureLogFileExists(logFilePath: string): Promise<void> {
        if (!existsSync(logFilePath)) {
            await mkdir(dirname(logFilePath), { recursive: true });
            await writeFile(logFilePath, '', 'utf-8');
        }
    }

    private buildRcloneArgs(socketPath: string, logFilePath: string): string[] {
        const enableDebugMode = true;
        const enableRcServe = true;
        const logLevel = enableDebugMode ? CONSTANTS.LOG_LEVEL.DEBUG : CONSTANTS.LOG_LEVEL.INFO;

        const args = [
            'rcd',
            '--rc-addr',
            socketPath,
            '--log-level',
            logLevel,
            '--log-file',
            logFilePath,
            '--rc-user',
            this.rcloneUsername,
            '--rc-pass',
            this.rclonePassword,
        ];

        if (enableRcServe) args.push('--rc-serve');

        if (enableDebugMode) {
            this.logger.log('Debug mode: Enhanced logging and RC serve enabled');
        }

        return args;
    }

    private setupProcessListeners(): void {
        if (!this.rcloneProcess) return;

        this.rcloneProcess.on('error', (error: Error) => {
            this.logger.error(`RClone process failed to start: ${error.message}`);
            this.cleanupFailedProcess();
        });

        this.rcloneProcess.on('exit', (code, signal) => {
            this.logger.warn(`RClone process exited unexpectedly with code: ${code}, signal: ${signal}`);
            this.cleanupFailedProcess();
        });
    }

    private cleanupFailedProcess(): void {
        this.rcloneProcess = null;
        this.isInitialized = false;
    }

    private async waitForSocketReady(): Promise<void> {
        await pRetry(async () => {
            const isRunning = await this.checkRcloneSocketRunning();
            if (!isRunning) throw new Error('Rclone socket not ready');
        }, CONSTANTS.RETRY_CONFIG);
    }

    private async stopRcloneSocket(): Promise<void> {
        if (this.rcloneProcess && !this.rcloneProcess.killed) {
            await this.terminateProcess();
        }

        await this.killExistingRcloneProcesses();
        await this.removeSocketFile();
    }

    private async terminateProcess(): Promise<void> {
        if (!this.rcloneProcess) return;

        this.logger.log(`Stopping RClone RC daemon process (PID: ${this.rcloneProcess.pid})...`);

        try {
            const killed = this.rcloneProcess.kill('SIGTERM');
            if (!killed) {
                this.logger.warn('Failed to kill with SIGTERM, using SIGKILL');
                this.rcloneProcess.kill('SIGKILL');
            }
            this.logger.log('RClone process stopped');
        } catch (error: unknown) {
            this.logger.error(`Error stopping RClone process: ${error}`);
        } finally {
            this.rcloneProcess = null;
        }
    }

    private async removeSocketFile(): Promise<void> {
        if (this.rcloneSocketPath && existsSync(this.rcloneSocketPath)) {
            this.logger.log(`Removing RClone socket file: ${this.rcloneSocketPath}`);
            try {
                await rm(this.rcloneSocketPath, { force: true });
            } catch (error: unknown) {
                this.logger.error(`Error removing socket file: ${error}`);
            }
        }
    }

    private async checkRcloneSocketExists(socketPath: string): Promise<boolean> {
        const socketExists = existsSync(socketPath);
        if (!socketExists) {
            this.logger.warn(`RClone socket does not exist at: ${socketPath}`);
        }
        return socketExists;
    }

    private async checkRcloneSocketRunning(): Promise<boolean> {
        try {
            await this.callRcloneApi('rc/noop');
            return true;
        } catch {
            return false;
        }
    }

    async getProviders(): Promise<RCloneProviderResponse[]> {
        const response = (await this.callRcloneApi('config/providers')) as {
            providers: RCloneProviderResponse[];
        };
        return response?.providers || [];
    }

    async listRemotes(): Promise<string[]> {
        const response = (await this.callRcloneApi('config/listremotes')) as { remotes: string[] };
        return response?.remotes || [];
    }

    async getRemoteDetails(input: GetRCloneRemoteDetailsDto): Promise<RCloneRemoteConfig> {
        await validateObject(GetRCloneRemoteDetailsDto, input);
        return this.getRemoteConfig({ name: input.name });
    }

    async getRemoteConfig(input: GetRCloneRemoteConfigDto): Promise<RCloneRemoteConfig> {
        await validateObject(GetRCloneRemoteConfigDto, input);
        return this.callRcloneApi('config/get', { name: input.name });
    }

    async createRemote(input: CreateRCloneRemoteDto): Promise<unknown> {
        await validateObject(CreateRCloneRemoteDto, input);
        this.logger.log(`Creating remote: ${input.name} (${input.type})`);

        const result = await this.callRcloneApi('config/create', {
            name: input.name,
            type: input.type,
            parameters: input.parameters,
        });

        this.logger.log(`Successfully created remote: ${input.name}`);
        return result;
    }

    async updateRemote(input: UpdateRCloneRemoteDto): Promise<unknown> {
        await validateObject(UpdateRCloneRemoteDto, input);
        this.logger.log(`Updating remote: ${input.name}`);

        return this.callRcloneApi('config/update', {
            name: input.name,
            ...input.parameters,
        });
    }

    async deleteRemote(input: DeleteRCloneRemoteDto): Promise<unknown> {
        await validateObject(DeleteRCloneRemoteDto, input);
        this.logger.log(`Deleting remote: ${input.name}`);
        return this.callRcloneApi('config/delete', { name: input.name });
    }

    async startBackup(input: RCloneStartBackupInput): Promise<unknown> {
        await validateObject(RCloneStartBackupInput, input);

        this.logger.log(`Starting backup: ${input.srcPath} → ${input.dstPath}`);

        const group = input.configId
            ? getBackupJobGroupId(input.configId)
            : BACKUP_JOB_GROUP_PREFIX + 'manual';

        const params = {
            srcFs: input.srcPath,
            dstFs: input.dstPath,
            ...(input.async && { _async: input.async }),
            _group: group,
            ...(input.options || {}),
        };

        const result = await this.callRcloneApi('sync/copy', params);
        const jobId = result.jobid || result.jobId || 'unknown';
        this.logger.log(`Backup job created with ID: ${jobId} in group: ${group}`);

        return result;
    }

    /**
     * Gets enhanced job status with computed fields
     */
    async getEnhancedJobStatus(jobId: string, configId?: string): Promise<RCloneJob | null> {
        try {
            await validateObject(GetRCloneJobStatusDto, { jobId });

            if (isBackupJobGroup(jobId)) {
                try {
                    const stats = await this.callRcloneApi('core/stats', { group: jobId });
                    const enhancedStats = this.statusService.enhanceStatsWithFormattedFields({
                        ...stats,
                        group: jobId,
                    });

                    const job = this.statusService.transformStatsToJob(jobId, enhancedStats);
                    job.configId = configId || getConfigIdFromGroupId(jobId);

                    // Add computed fields
                    job.isRunning = job.status === BackupJobStatus.RUNNING;
                    job.errorMessage = job.error || undefined;

                    return job;
                } catch (error) {
                    this.logger.warn(`Failed to get group stats for ${jobId}: ${error}`);
                }
            }

            // Fallback to individual job status
            const jobStatus = await this.getIndividualJobStatus(jobId);
            const enhancedStats = jobStatus.stats
                ? this.statusService.enhanceStatsWithFormattedFields(jobStatus.stats)
                : {};

            const job = this.statusService.transformStatsToJob(jobId, enhancedStats);

            // Add computed fields
            job.isRunning = job.status === BackupJobStatus.RUNNING;
            job.errorMessage = job.error || undefined;

            // Add configId if provided
            if (configId) {
                job.configId = configId;
            }

            return job;
        } catch (error) {
            this.logger.error(`Failed to fetch enhanced job status for ${jobId}: %o`, error);
            return null;
        }
    }

    async getJobStatus(input: GetRCloneJobStatusDto): Promise<RCloneJob> {
        const enhancedJob = await this.getEnhancedJobStatus(input.jobId);
        if (enhancedJob) {
            return enhancedJob;
        }

        // Final fallback
        const jobStatus = await this.getIndividualJobStatus(input.jobId);
        return this.statusService.parseJobWithStats(input.jobId, jobStatus);
    }

    async getIndividualJobStatus(jobId: string): Promise<RCloneJobStatusResponse> {
        this.logger.debug(`Fetching status for job ${jobId}`);
        const result = await this.callRcloneApi('job/status', { jobid: jobId });

        if (result.error) {
            this.logger.warn(`Job ${jobId} has error: ${result.error}`);
        }

        return result;
    }

    async listRunningJobs(): Promise<RCloneJobListResponse> {
        this.logger.debug('Fetching job list from RClone API');
        return this.callRcloneApi('job/list');
    }

    async getAllJobsWithStats(): Promise<RCloneJob[]> {
        try {
            // Get both the job list and group list
            const [runningJobs, groupList] = await Promise.all([
                this.listRunningJobs(),
                this.callRcloneApi('core/group-list'),
            ]);

            this.logger.debug(`Running jobs: ${JSON.stringify(runningJobs)}`);
            this.logger.debug(`Group list: ${JSON.stringify(groupList)}`);

            // Safety check: if too many groups, something is wrong
            if (groupList.groups && groupList.groups.length > 100) {
                this.logger.error(
                    `DANGER: Found ${groupList.groups.length} groups, aborting to prevent job explosion`
                );
                return [];
            }

            // Safety check: if too many individual jobs, something is wrong
            if (runningJobs.jobids && runningJobs.jobids.length > 1000) {
                this.logger.error(
                    `DANGER: Found ${runningJobs.jobids.length} individual jobs, aborting to prevent performance issues`
                );
                return [];
            }

            if (!runningJobs.jobids?.length) {
                this.logger.debug('No running jobs found');
                return [];
            }

            const backupGroups = (groupList.groups || []).filter((group: string) =>
                isBackupJobGroup(group)
            );

            if (backupGroups.length === 0) {
                this.logger.debug('No backup groups found');
                return [];
            }

            // Get group stats for all backup groups to get proper stats and group info
            const groupStatsMap = new Map<string, any>();
            await Promise.all(
                backupGroups.map(async (group: string) => {
                    try {
                        const stats = await this.callRcloneApi('core/stats', { group });
                        groupStatsMap.set(group, stats);
                    } catch (error) {
                        this.logger.warn(`Failed to get stats for group ${group}: ${error}`);
                    }
                })
            );

            const jobs: RCloneJob[] = [];

            // For each backup group, create a job entry with proper stats
            backupGroups.forEach((group) => {
                const groupStats = groupStatsMap.get(group);
                if (!groupStats) return;

                this.logger.debug(`Processing group ${group}: stats=${JSON.stringify(groupStats)}`);

                const extractedConfigId = getConfigIdFromGroupId(group);

                const enhancedStats = this.statusService.enhanceStatsWithFormattedFields({
                    ...groupStats,
                    group,
                });

                const job = this.statusService.transformStatsToJob(group, enhancedStats);
                job.configId = extractedConfigId;

                // Only include jobs that are truly active (not completed)
                const isActivelyTransferring = groupStats.transferring?.length > 0;
                const isActivelyChecking = groupStats.checking?.length > 0;
                const hasActiveSpeed = groupStats.speed > 0;
                const isNotFinished = !groupStats.finished && groupStats.fatalError !== true;

                if ((isActivelyTransferring || isActivelyChecking || hasActiveSpeed) && isNotFinished) {
                    jobs.push(job);
                }
            });

            this.logger.debug(
                `Found ${jobs.length} active backup jobs from ${backupGroups.length} groups`
            );
            return jobs;
        } catch (error) {
            this.logger.error('Failed to get jobs with stats:', error);
            return [];
        }
    }

    async stopAllJobs(): Promise<JobOperationResult> {
        const runningJobs = await this.listRunningJobs();

        if (!runningJobs.jobids?.length) {
            this.logger.log('No running jobs to stop');
            return { stopped: [], errors: [] };
        }

        this.logger.log(`Stopping ${runningJobs.jobids.length} running jobs`);
        return this.executeJobOperation(runningJobs.jobids, 'stop');
    }

    async stopJob(jobId: string): Promise<JobOperationResult> {
        this.logger.log(`Stopping job: ${jobId}`);

        if (isBackupJobGroup(jobId)) {
            // This is a group, use the stopgroup endpoint
            return this.executeGroupOperation([jobId], 'stopgroup');
        } else {
            // This is an individual job ID, use the regular stop endpoint
            return this.executeJobOperation([jobId], 'stop');
        }
    }

    private async executeGroupOperation(
        groupNames: string[],
        operation: 'stopgroup'
    ): Promise<JobOperationResult> {
        const stopped: string[] = [];
        const errors: string[] = [];

        const promises = groupNames.map(async (groupName) => {
            try {
                await this.callRcloneApi(`job/${operation}`, { group: groupName });
                stopped.push(groupName);
                this.logger.log(`${operation}ped group: ${groupName}`);
            } catch (error) {
                const errorMsg = `Failed to ${operation} group ${groupName}: ${error}`;
                errors.push(errorMsg);
                this.logger.error(errorMsg);
            }
        });

        await Promise.allSettled(promises);
        return { stopped, errors };
    }

    private async executeJobOperation(
        jobIds: (string | number)[],
        operation: 'stop'
    ): Promise<JobOperationResult> {
        const stopped: string[] = [];
        const errors: string[] = [];

        const promises = jobIds.map(async (jobId) => {
            try {
                await this.callRcloneApi(`job/${operation}`, { jobid: jobId });
                stopped.push(String(jobId));
                this.logger.log(`${operation}ped job: ${jobId}`);
            } catch (error) {
                const errorMsg = `Failed to ${operation} job ${jobId}: ${error}`;
                errors.push(errorMsg);
                this.logger.error(errorMsg);
            }
        });

        await Promise.allSettled(promises);
        return { stopped, errors };
    }

    async getBackupStatus(): Promise<BackupStatusResult> {
        const runningJobs = await this.listRunningJobs();

        if (!runningJobs.jobids?.length) {
            return this.statusService.parseBackupStatus(runningJobs, []);
        }

        const jobStatuses = await Promise.allSettled(
            runningJobs.jobids.map((jobId) => this.getIndividualJobStatus(String(jobId)))
        );

        return this.statusService.parseBackupStatus(runningJobs, jobStatuses);
    }

    private async callRcloneApi(endpoint: string, params: Record<string, unknown> = {}): Promise<any> {
        const url = `${this.rcloneBaseUrl}/${endpoint}`;

        try {
            const response = await got.post(url, {
                json: params,
                responseType: 'json',
                enableUnixSockets: true,
                headers: {
                    Authorization: `Basic ${Buffer.from(`${this.rcloneUsername}:${this.rclonePassword}`).toString('base64')}`,
                },
            });

            return response.body;
        } catch (error: unknown) {
            this.handleApiError(error, endpoint, params);
        }
    }

    private handleApiError(error: unknown, endpoint: string, params: Record<string, unknown>): never {
        const sanitizedParams = sanitizeParams(params);

        if (error instanceof HTTPError) {
            const statusCode = error.response.statusCode;
            const rcloneError = this.extractRcloneError(error.response.body, params);
            const message = `Rclone API Error (${endpoint}, HTTP ${statusCode}): ${rcloneError}`;

            this.logger.error(`${message} | Params: ${JSON.stringify(sanitizedParams)}`, error.stack);
            throw new Error(message);
        }

        const message =
            error instanceof Error
                ? `Error calling RClone API (${endpoint}): ${error.message}`
                : `Unknown error calling RClone API (${endpoint}): ${String(error)}`;

        this.logger.error(
            `${message} | Params: ${JSON.stringify(sanitizedParams)}`,
            error instanceof Error ? error.stack : undefined
        );
        throw error instanceof Error ? error : new Error(message);
    }

    private extractRcloneError(responseBody: unknown, fallbackParams: Record<string, unknown>): string {
        try {
            const errorBody = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;

            if (errorBody && typeof errorBody === 'object' && 'error' in errorBody) {
                const typedError = errorBody as { error: unknown; input?: unknown };
                let message = `Rclone Error: ${String(typedError.error)}`;

                if (typedError.input) {
                    message += ` | Input: ${JSON.stringify(typedError.input)}`;
                } else {
                    message += ` | Params: ${JSON.stringify(fallbackParams)}`;
                }

                return message;
            }

            return responseBody
                ? `Non-standard error response: ${typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)}`
                : 'Empty error response received';
        } catch {
            return `Failed to process error response: ${typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)}`;
        }
    }

    private async killExistingRcloneProcesses(): Promise<void> {
        try {
            this.logger.log('Checking for existing rclone processes...');
            const { stdout } = await execa('pgrep', ['-f', 'rclone.*rcd'], { reject: false });

            if (!stdout.trim()) {
                this.logger.log('No existing rclone processes found');
                return;
            }

            const pids = stdout
                .trim()
                .split('\n')
                .filter((pid) => pid.trim());
            this.logger.log(`Found ${pids.length} existing rclone process(es): ${pids.join(', ')}`);

            await this.terminateProcesses(pids);
            await this.cleanupStaleSocket();
        } catch (error) {
            this.logger.warn(`Error during rclone process cleanup: ${error}`);
        }
    }

    private async terminateProcesses(pids: string[]): Promise<void> {
        for (const pid of pids) {
            try {
                this.logger.log(`Terminating rclone process PID: ${pid}`);

                await execa('kill', ['-TERM', pid], { reject: false });
                await new Promise((resolve) =>
                    setTimeout(resolve, CONSTANTS.TIMEOUTS.GRACEFUL_SHUTDOWN)
                );

                const { exitCode } = await execa('kill', ['-0', pid], { reject: false });

                if (exitCode === 0) {
                    this.logger.warn(`Process ${pid} still running, using SIGKILL`);
                    await execa('kill', ['-KILL', pid], { reject: false });
                    await new Promise((resolve) =>
                        setTimeout(resolve, CONSTANTS.TIMEOUTS.PROCESS_CLEANUP)
                    );
                }

                this.logger.log(`Successfully terminated process ${pid}`);
            } catch (error) {
                this.logger.warn(`Failed to kill process ${pid}: ${error}`);
            }
        }
    }

    private async cleanupStaleSocket(): Promise<void> {
        if (this.rcloneSocketPath && existsSync(this.rcloneSocketPath)) {
            await rm(this.rcloneSocketPath, { force: true });
            this.logger.log('Removed stale socket file');
        }
    }
}
