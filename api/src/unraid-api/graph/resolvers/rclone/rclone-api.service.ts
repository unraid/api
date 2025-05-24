import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import crypto from 'crypto';
import { ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { execa } from 'execa';
import got, { HTTPError } from 'got';
import pRetry from 'p-retry';

import { sanitizeParams } from '@app/core/log.js';
import { FormatService } from '@app/unraid-api/graph/resolvers/backup/format.service.js';
import {
    CreateRCloneRemoteDto,
    DeleteRCloneRemoteDto,
    GetRCloneJobStatusDto,
    GetRCloneRemoteConfigDto,
    GetRCloneRemoteDetailsDto,
    RCloneJobListResponse,
    RCloneJobStats,
    RCloneJobStatusResponse,
    RCloneJobsWithStatsResponse,
    RCloneJobWithStats,
    RCloneProviderOptionResponse,
    RCloneProviderResponse,
    RCloneRemoteConfig,
    RCloneStartBackupInput,
    UpdateRCloneRemoteDto,
} from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { validateObject } from '@app/unraid-api/graph/resolvers/validation.utils.js';

@Injectable()
export class RCloneApiService implements OnModuleInit, OnModuleDestroy {
    private isInitialized: boolean = false;
    private readonly logger = new Logger(RCloneApiService.name);
    private rcloneSocketPath: string = '';
    private rcloneBaseUrl: string = '';
    private rcloneProcess: ChildProcess | null = null;
    private readonly rcloneUsername: string =
        process.env.RCLONE_USERNAME || crypto.randomBytes(12).toString('base64');
    private readonly rclonePassword: string =
        process.env.RCLONE_PASSWORD || crypto.randomBytes(24).toString('base64');
    constructor(private readonly formatService: FormatService) {}

    async onModuleInit(): Promise<void> {
        try {
            const { getters } = await import('@app/store/index.js');
            this.rcloneSocketPath = getters.paths()['rclone-socket'];
            const logFilePath = join(getters.paths()['log-base'], 'rclone-unraid-api.log');
            this.logger.log(`RClone socket path: ${this.rcloneSocketPath}`);
            this.logger.log(`RClone log file path: ${logFilePath}`);

            this.rcloneBaseUrl = `http://unix:${this.rcloneSocketPath}:`;

            const socketExists = await this.checkRcloneSocketExists(this.rcloneSocketPath);

            if (socketExists) {
                const isRunning = await this.checkRcloneSocketRunning();
                if (isRunning) {
                    this.isInitialized = true;
                    return;
                } else {
                    this.logger.warn(
                        'RClone socket is not running but socket exists, removing socket before starting...'
                    );
                    await rm(this.rcloneSocketPath, { force: true });
                }

                this.logger.warn('RClone socket is not running, starting it...');
                this.isInitialized = await this.startRcloneSocket(this.rcloneSocketPath, logFilePath);
                return;
            } else {
                this.logger.warn('RClone socket does not exist, creating it...');
                this.isInitialized = await this.startRcloneSocket(this.rcloneSocketPath, logFilePath);
                return;
            }
        } catch (error: unknown) {
            this.logger.error(`Error initializing RCloneApiService: ${error}`);
            this.isInitialized = false;
        }
    }

    async onModuleDestroy(): Promise<void> {
        await this.stopRcloneSocket();
        this.logger.log('RCloneApiService module destroyed');
    }

    private async startRcloneSocket(socketPath: string, logFilePath: string): Promise<boolean> {
        try {
            if (!existsSync(logFilePath)) {
                await mkdir(dirname(logFilePath), { recursive: true });
                await writeFile(logFilePath, '', 'utf-8');
            }
            this.logger.log(`Starting RClone RC daemon on socket: ${socketPath}`);

            this.rcloneProcess = execa(
                'rclone',
                [
                    'rcd',
                    '--rc-addr',
                    socketPath,
                    '--log-level',
                    'INFO',
                    '--log-file',
                    logFilePath,
                    ...(this.rcloneUsername ? ['--rc-user', this.rcloneUsername] : []),
                    ...(this.rclonePassword ? ['--rc-pass', this.rclonePassword] : []),
                ],
                { detached: false }
            );

            this.rcloneProcess.on('error', (error: Error) => {
                this.logger.error(`RClone process failed to start: ${error.message}`);
                this.rcloneProcess = null;
                this.isInitialized = false;
            });

            this.rcloneProcess.on('exit', (code, signal) => {
                this.logger.warn(
                    `RClone process exited unexpectedly with code: ${code}, signal: ${signal}`
                );
                this.rcloneProcess = null;
                this.isInitialized = false;
            });

            await pRetry(
                async () => {
                    const isRunning = await this.checkRcloneSocketRunning();
                    if (!isRunning) throw new Error('Rclone socket not ready');
                },
                {
                    retries: 6,
                    minTimeout: 100,
                    maxTimeout: 5000,
                    factor: 2,
                    maxRetryTime: 30000,
                }
            );

            return true;
        } catch (error: unknown) {
            this.logger.error(`Error starting RClone RC daemon: ${error}`);
            this.rcloneProcess?.kill();
            this.rcloneProcess = null;
            return false;
        }
    }

    private async stopRcloneSocket(): Promise<void> {
        if (this.rcloneProcess && !this.rcloneProcess.killed) {
            this.logger.log(`Stopping RClone RC daemon process (PID: ${this.rcloneProcess.pid})...`);
            try {
                const killed = this.rcloneProcess.kill('SIGTERM');
                if (!killed) {
                    this.logger.warn('Failed to kill RClone process with SIGTERM, trying SIGKILL.');
                    this.rcloneProcess.kill('SIGKILL');
                }
                this.logger.log('RClone process stopped.');
            } catch (error: unknown) {
                this.logger.error(`Error stopping RClone process: ${error}`);
            } finally {
                this.rcloneProcess = null;
            }
        } else {
            this.logger.log('RClone process not running or already stopped.');
        }

        if (this.rcloneSocketPath && existsSync(this.rcloneSocketPath)) {
            this.logger.log(`Removing RClone socket file: ${this.rcloneSocketPath}`);
            try {
                await rm(this.rcloneSocketPath, { force: true });
            } catch (error: unknown) {
                this.logger.error(`Error removing RClone socket file: ${error}`);
            }
        }
    }

    private async checkRcloneSocketExists(socketPath: string): Promise<boolean> {
        const socketExists = existsSync(socketPath);
        if (!socketExists) {
            this.logger.warn(`RClone socket does not exist at: ${socketPath}`);
            return false;
        }
        return true;
    }

    private async checkRcloneSocketRunning(): Promise<boolean> {
        try {
            await this.callRcloneApi('core/pid');
            return true;
        } catch (error: unknown) {
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
        const config = (await this.getRemoteConfig({ name: input.name })) || {};
        return config as RCloneRemoteConfig;
    }

    async getRemoteConfig(input: GetRCloneRemoteConfigDto): Promise<RCloneRemoteConfig> {
        await validateObject(GetRCloneRemoteConfigDto, input);
        return this.callRcloneApi('config/get', { name: input.name });
    }

    async createRemote(input: CreateRCloneRemoteDto): Promise<any> {
        await validateObject(CreateRCloneRemoteDto, input);
        this.logger.log(`Creating new remote: ${input.name} of type: ${input.type}`);
        const params = {
            name: input.name,
            type: input.type,
            parameters: input.parameters,
        };
        const result = await this.callRcloneApi('config/create', params);
        this.logger.log(`Successfully created remote: ${input.name}`);
        return result;
    }

    async updateRemote(input: UpdateRCloneRemoteDto): Promise<any> {
        await validateObject(UpdateRCloneRemoteDto, input);
        this.logger.log(`Updating remote: ${input.name}`);
        const params = {
            name: input.name,
            ...input.parameters,
        };
        return this.callRcloneApi('config/update', params);
    }

    async deleteRemote(input: DeleteRCloneRemoteDto): Promise<any> {
        await validateObject(DeleteRCloneRemoteDto, input);
        this.logger.log(`Deleting remote: ${input.name}`);
        return this.callRcloneApi('config/delete', { name: input.name });
    }

    async startBackup(input: RCloneStartBackupInput): Promise<any> {
        await validateObject(RCloneStartBackupInput, input);
        this.logger.log(
            `Starting backup from ${input.srcPath} to ${input.dstPath} with group: ${input.group}`
        );
        const params = {
            srcFs: input.srcPath,
            dstFs: input.dstPath,
            ...(input.async && { _async: input.async }),
            ...(input.group && { _group: input.group }),
            ...(input.options || {}),
        };

        const result = await this.callRcloneApi('sync/copy', params);

        this.logger.log(
            `Backup job created with ID: ${result.jobid || result.jobId || 'unknown'}, group: ${input.group}`
        );

        return result;
    }

    async getJobStatus(input: GetRCloneJobStatusDto): Promise<RCloneJobStatusResponse> {
        await validateObject(GetRCloneJobStatusDto, input);

        const result = await this.callRcloneApi('job/status', { jobid: input.jobId });

        if (result.error) {
            this.logger.warn(`Job ${input.jobId} has error: ${result.error}`);
        }

        if (!result.stats && result.group) {
            try {
                const groupStats = await this.getGroupStats(result.group);
                if (groupStats && typeof groupStats === 'object') {
                    result.stats = { ...groupStats };
                }
            } catch (groupError) {
                this.logger.warn(`Failed to get group stats for job ${input.jobId}: ${groupError}`);
            }
        }

        if (result.stats) {
            result.stats = this.enhanceStatsWithFormattedFields(result.stats);
        }

        return result;
    }

    async listRunningJobs(): Promise<RCloneJobListResponse> {
        const result = await this.callRcloneApi('job/list');
        return result;
    }

    async getGroupStats(group: string): Promise<any> {
        const result = await this.callRcloneApi('core/stats', { group });
        return result;
    }

    async getBackupJobsWithStats(): Promise<RCloneJobsWithStatsResponse> {
        const jobList = await this.listRunningJobs();

        if (!jobList.jobids || jobList.jobids.length === 0) {
            this.logger.log('No active jobs found in RClone');
            return { jobids: [], stats: [] };
        }

        this.logger.log(
            `Found ${jobList.jobids.length} active jobs in RClone, processing all jobs with stats`
        );

        const allJobs: RCloneJobWithStats[] = [];
        let successfulJobQueries = 0;

        for (const jobId of jobList.jobids) {
            try {
                const jobStatus = await this.getJobStatus({ jobId: String(jobId) });
                const group = jobStatus.group || '';

                let detailedStats = {};
                if (group) {
                    try {
                        const groupStats = await this.getGroupStats(group);
                        if (groupStats && typeof groupStats === 'object') {
                            detailedStats = { ...groupStats };
                        }
                    } catch (groupError) {
                        this.logger.warn(
                            `Failed to get core/stats for job ${jobId}, group ${group}: ${groupError}`
                        );
                    }
                }

                const enhancedStats = {
                    ...jobStatus.stats,
                    ...detailedStats,
                };

                const finalStats = this.enhanceStatsWithFormattedFields(enhancedStats);

                allJobs.push({
                    jobId,
                    stats: finalStats,
                });

                successfulJobQueries++;
            } catch (error) {
                this.logger.error(`Failed to get status for job ${jobId}: ${error}`);
            }
        }

        this.logger.log(
            `Successfully queried ${successfulJobQueries} jobs from ${jobList.jobids.length} total jobs`
        );

        const result: RCloneJobsWithStatsResponse = {
            jobids: allJobs.map((job) => job.jobId),
            stats: allJobs.map((job) => job.stats),
        };

        return result;
    }

    async getAllJobsWithStats(): Promise<RCloneJobsWithStatsResponse> {
        const jobList = await this.listRunningJobs();

        if (!jobList.jobids || jobList.jobids.length === 0) {
            this.logger.log('No active jobs found in RClone');
            return { jobids: [], stats: [] };
        }

        this.logger.log(
            `Found ${jobList.jobids.length} active jobs in RClone: [${jobList.jobids.join(', ')}]`
        );

        const allJobs: RCloneJobWithStats[] = [];
        let successfulJobQueries = 0;

        for (const jobId of jobList.jobids) {
            try {
                const jobStatus = await this.getJobStatus({ jobId: String(jobId) });
                const group = jobStatus.group || '';

                let detailedStats = {};
                if (group) {
                    try {
                        const groupStats = await this.getGroupStats(group);
                        if (groupStats && typeof groupStats === 'object') {
                            detailedStats = { ...groupStats };
                        }
                    } catch (groupError) {
                        this.logger.warn(
                            `Failed to get core/stats for job ${jobId}, group ${group}: ${groupError}`
                        );
                    }
                }

                const enhancedStats = {
                    ...jobStatus.stats,
                    ...detailedStats,
                };

                const finalStats = this.enhanceStatsWithFormattedFields(enhancedStats);

                allJobs.push({
                    jobId,
                    stats: finalStats,
                });

                successfulJobQueries++;
            } catch (error) {
                this.logger.error(`Failed to get status for job ${jobId}: ${error}`);
            }
        }

        this.logger.log(
            `Successfully queried ${successfulJobQueries}/${jobList.jobids.length} jobs for detailed stats`
        );

        const result: RCloneJobsWithStatsResponse = {
            jobids: allJobs.map((job) => job.jobId),
            stats: allJobs.map((job) => job.stats),
        };

        return result;
    }

    private enhanceStatsWithFormattedFields(stats: RCloneJobStats): RCloneJobStats {
        const enhancedStats = { ...stats };

        if (stats.bytes !== undefined && stats.bytes !== null) {
            enhancedStats.formattedBytes = this.formatService.formatBytes(stats.bytes);
        }

        if (stats.speed !== undefined && stats.speed !== null && stats.speed > 0) {
            enhancedStats.formattedSpeed = this.formatService.formatBytes(stats.speed);
        }

        if (stats.elapsedTime !== undefined && stats.elapsedTime !== null) {
            enhancedStats.formattedElapsedTime = this.formatService.formatDuration(stats.elapsedTime);
        }

        if (stats.eta !== undefined && stats.eta !== null && stats.eta > 0) {
            enhancedStats.formattedEta = this.formatService.formatDuration(stats.eta);
        }

        return enhancedStats;
    }

    private async callRcloneApi(endpoint: string, params: Record<string, any> = {}): Promise<any> {
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
        if (error instanceof HTTPError) {
            const statusCode = error.response.statusCode;
            const rcloneError = this.extractRcloneError(error.response.body, params);
            const detailedErrorMessage = `Rclone API Error (${endpoint}, HTTP ${statusCode}): ${rcloneError}`;

            const sanitizedParams = sanitizeParams(params);
            this.logger.error(
                `Original ${detailedErrorMessage} | Params: ${JSON.stringify(sanitizedParams)}`,
                error.stack
            );

            throw new Error(detailedErrorMessage);
        } else if (error instanceof Error) {
            const detailedErrorMessage = `Error calling RClone API (${endpoint}) with params ${JSON.stringify(sanitizeParams(params))}: ${error.message}`;
            this.logger.error(detailedErrorMessage, error.stack);
            throw error;
        } else {
            const detailedErrorMessage = `Unknown error calling RClone API (${endpoint}) with params ${JSON.stringify(sanitizeParams(params))}: ${String(error)}`;
            this.logger.error(detailedErrorMessage);
            throw new Error(detailedErrorMessage);
        }
    }

    private extractRcloneError(responseBody: unknown, fallbackParams: Record<string, unknown>): string {
        try {
            let errorBody: unknown;
            if (typeof responseBody === 'string') {
                errorBody = JSON.parse(responseBody);
            } else if (typeof responseBody === 'object' && responseBody !== null) {
                errorBody = responseBody;
            }

            if (errorBody && typeof errorBody === 'object' && 'error' in errorBody) {
                const typedErrorBody = errorBody as { error: unknown; input?: unknown };
                let rcloneError = `Rclone Error: ${String(typedErrorBody.error)}`;
                if (typedErrorBody.input) {
                    rcloneError += ` | Input: ${JSON.stringify(typedErrorBody.input)}`;
                } else if (fallbackParams) {
                    rcloneError += ` | Original Params: ${JSON.stringify(fallbackParams)}`;
                }
                return rcloneError;
            } else if (responseBody) {
                return `Non-standard error response body: ${typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)}`;
            } else {
                return 'Empty error response body received.';
            }
        } catch (parseOrAccessError) {
            return `Failed to process error response body. Raw body: ${typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)}`;
        }
    }
}
