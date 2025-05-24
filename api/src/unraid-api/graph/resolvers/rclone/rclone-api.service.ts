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
import {
    CreateRCloneRemoteDto,
    DeleteRCloneRemoteDto,
    GetRCloneJobStatusDto,
    GetRCloneRemoteConfigDto,
    GetRCloneRemoteDetailsDto,
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
    constructor() {}

    async onModuleInit(): Promise<void> {
        try {
            const { getters } = await import('@app/store/index.js');
            // Check if Rclone Socket is running, if not, start it.
            this.rcloneSocketPath = getters.paths()['rclone-socket'];
            const logFilePath = join(getters.paths()['log-base'], 'rclone-unraid-api.log');
            this.logger.log(`RClone socket path: ${this.rcloneSocketPath}`);
            this.logger.log(`RClone log file path: ${logFilePath}`);

            // Format the base URL for Unix socket
            this.rcloneBaseUrl = `http://unix:${this.rcloneSocketPath}:`;

            // Check if the RClone socket exists, if not, create it.
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

    /**
     * Starts the RClone RC daemon on the specified socket path
     */
    private async startRcloneSocket(socketPath: string, logFilePath: string): Promise<boolean> {
        try {
            // Make log file exists
            if (!existsSync(logFilePath)) {
                this.logger.debug(`Creating log file: ${logFilePath}`);
                await mkdir(dirname(logFilePath), { recursive: true });
                await writeFile(logFilePath, '', 'utf-8');
            }
            this.logger.log(`Starting RClone RC daemon on socket: ${socketPath}`);
            // Start the process but don't wait for it to finish
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
                { detached: false } // Keep attached to manage lifecycle
            );

            // Handle potential errors during process spawning (e.g., command not found)
            this.rcloneProcess.on('error', (error: Error) => {
                this.logger.error(`RClone process failed to start: ${error.message}`);
                this.rcloneProcess = null; // Clear the handle on error
                this.isInitialized = false;
            });

            // Handle unexpected exit
            this.rcloneProcess.on('exit', (code, signal) => {
                this.logger.warn(
                    `RClone process exited unexpectedly with code: ${code}, signal: ${signal}`
                );
                this.rcloneProcess = null;
                this.isInitialized = false;
            });

            // Wait for socket to be ready using p-retry with exponential backoff
            await pRetry(
                async () => {
                    const isRunning = await this.checkRcloneSocketRunning();
                    if (!isRunning) throw new Error('Rclone socket not ready');
                },
                {
                    retries: 6, // 7 attempts total
                    minTimeout: 100,
                    maxTimeout: 5000,
                    factor: 2,
                    maxRetryTime: 30000,
                }
            );

            return true;
        } catch (error: unknown) {
            this.logger.error(`Error starting RClone RC daemon: ${error}`);
            this.rcloneProcess?.kill(); // Attempt to kill if started but failed later
            this.rcloneProcess = null;
            return false;
        }
    }

    private async stopRcloneSocket(): Promise<void> {
        if (this.rcloneProcess && !this.rcloneProcess.killed) {
            this.logger.log(`Stopping RClone RC daemon process (PID: ${this.rcloneProcess.pid})...`);
            try {
                const killed = this.rcloneProcess.kill('SIGTERM'); // Send SIGTERM first
                if (!killed) {
                    this.logger.warn('Failed to kill RClone process with SIGTERM, trying SIGKILL.');
                    this.rcloneProcess.kill('SIGKILL'); // Force kill if SIGTERM failed
                }
                this.logger.log('RClone process stopped.');
            } catch (error: unknown) {
                this.logger.error(`Error stopping RClone process: ${error}`);
            } finally {
                this.rcloneProcess = null; // Clear the handle
            }
        } else {
            this.logger.log('RClone process not running or already stopped.');
        }

        // Clean up the socket file if it exists
        if (this.rcloneSocketPath && existsSync(this.rcloneSocketPath)) {
            this.logger.log(`Removing RClone socket file: ${this.rcloneSocketPath}`);
            try {
                await rm(this.rcloneSocketPath, { force: true });
            } catch (error: unknown) {
                this.logger.error(`Error removing RClone socket file: ${error}`);
            }
        }
    }

    /**
     * Checks if the RClone socket exists
     */
    private async checkRcloneSocketExists(socketPath: string): Promise<boolean> {
        const socketExists = existsSync(socketPath);
        if (!socketExists) {
            this.logger.warn(`RClone socket does not exist at: ${socketPath}`);
            return false;
        }
        return true;
    }

    /**
     * Checks if the RClone socket is running
     */
    private async checkRcloneSocketRunning(): Promise<boolean> {
        // Use the API check instead of execa('rclone', ['about']) as rclone might not be in PATH
        // or configured correctly for the execa environment vs the rcd environment.
        try {
            // A simple API call to check if the daemon is responsive
            await this.callRcloneApi('core/pid');
            this.logger.debug('RClone socket is running and responsive.');
            return true;
        } catch (error: unknown) {
            // Log less verbosely during checks
            // this.logger.error(`Error checking RClone socket: ${error}`);
            return false;
        }
    }

    /**
     * Get providers supported by RClone
     */
    async getProviders(): Promise<RCloneProviderResponse[]> {
        const response = (await this.callRcloneApi('config/providers')) as {
            providers: RCloneProviderResponse[];
        };
        return response?.providers || [];
    }

    /**
     * List all remotes configured in rclone
     */
    async listRemotes(): Promise<string[]> {
        const response = (await this.callRcloneApi('config/listremotes')) as { remotes: string[] };
        return response?.remotes || [];
    }

    /**
     * Get complete remote details
     */
    async getRemoteDetails(input: GetRCloneRemoteDetailsDto): Promise<RCloneRemoteConfig> {
        await validateObject(GetRCloneRemoteDetailsDto, input);
        const config = (await this.getRemoteConfig({ name: input.name })) || {};
        return config as RCloneRemoteConfig;
    }

    /**
     * Get configuration of a remote
     */
    async getRemoteConfig(input: GetRCloneRemoteConfigDto): Promise<RCloneRemoteConfig> {
        await validateObject(GetRCloneRemoteConfigDto, input);
        return this.callRcloneApi('config/get', { name: input.name });
    }

    /**
     * Create a new remote configuration
     */
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

    /**
     * Update an existing remote configuration
     */
    async updateRemote(input: UpdateRCloneRemoteDto): Promise<any> {
        await validateObject(UpdateRCloneRemoteDto, input);
        this.logger.log(`Updating remote: ${input.name}`);
        const params = {
            name: input.name,
            ...input.parameters,
        };
        return this.callRcloneApi('config/update', params);
    }

    /**
     * Delete a remote configuration
     */
    async deleteRemote(input: DeleteRCloneRemoteDto): Promise<any> {
        await validateObject(DeleteRCloneRemoteDto, input);
        this.logger.log(`Deleting remote: ${input.name}`);
        return this.callRcloneApi('config/delete', { name: input.name });
    }

    /**
     * Start a backup operation using sync/copy
     * This copies a directory from source to destination
     */
    async startBackup(input: RCloneStartBackupInput): Promise<any> {
        await validateObject(RCloneStartBackupInput, input);
        this.logger.log(`Starting backup from ${input.srcPath} to ${input.dstPath}`);
        const params = {
            srcFs: input.srcPath,
            dstFs: input.dstPath,
            ...(input.options || {}),
        };
        return this.callRcloneApi('sync/copy', params);
    }

    /**
     * Get the status of a running job
     */
    async getJobStatus(input: GetRCloneJobStatusDto): Promise<any> {
        await validateObject(GetRCloneJobStatusDto, input);
        return this.callRcloneApi('job/status', { jobid: input.jobId });
    }

    /**
     * List all running jobs
     */
    async listRunningJobs(): Promise<any> {
        return this.callRcloneApi('job/list');
    }

    /**
     * Generic method to call the RClone RC API
     */
    private async callRcloneApi(endpoint: string, params: Record<string, any> = {}): Promise<any> {
        const url = `${this.rcloneBaseUrl}/${endpoint}`;
        try {
            this.logger.debug(
                `Calling RClone API: ${url} with params: ${JSON.stringify(sanitizeParams(params))}`
            );

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
