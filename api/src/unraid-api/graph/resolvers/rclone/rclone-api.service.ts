import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { execa } from 'execa';
import got, { HTTPError } from 'got';

import {
    RCloneProviderOptionResponse,
    RCloneProviderResponse,
    RCloneRemoteConfig,
} from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';

// Define the structure returned by mapProviderOptions inline
interface MappedRCloneProviderOption {
    name: string;
    help: string;
    provider?: string;
    default: any;
    value: any;
    shortOpt?: string;
    hide?: number;
    required?: boolean;
    isPassword?: boolean;
    noPrefix?: boolean;
    advanced?: boolean;
    defaultStr?: string;
    valueStr?: string;
    type?: string;
    examples?: { value: string; help: string; provider?: string }[];
}

@Injectable()
export class RCloneApiService implements OnModuleInit, OnModuleDestroy {
    private isInitialized: boolean = false;
    private readonly logger = new Logger(RCloneApiService.name);
    private rcloneSocketPath: string = '';
    private rcloneBaseUrl: string = '';
    private rcloneProcess: ChildProcess | null = null;
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
                    '--rc-user',
                    this.rcloneUsername,
                    '--rc-pass',
                    this.rclonePassword,
                    '--log-file',
                    logFilePath,
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

            // Consider the service initialized shortly after starting the process
            // A better approach might involve checking the socket or API readiness
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Small delay
            // Re-check if socket is running after attempting start
            const isRunning = await this.checkRcloneSocketRunning();
            if (!isRunning) {
                throw new Error('Rclone socket failed to start or become responsive.');
            }

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
     * Maps RClone provider options from API format to our model format
     */
    private mapProviderOptions(options: RCloneProviderOptionResponse[]): MappedRCloneProviderOption[] {
        return options.map((option) => ({
            name: option.Name,
            help: option.Help,
            provider: option.Provider,
            default: option.Default,
            value: option.Value,
            shortOpt: option.ShortOpt,
            hide: option.Hide,
            required: option.Required,
            isPassword: option.IsPassword,
            noPrefix: option.NoPrefix,
            advanced: option.Advanced,
            defaultStr: option.DefaultStr,
            valueStr: option.ValueStr,
            type: option.Type,
            examples: option.Examples?.map((example) => ({
                value: example.Value,
                help: example.Help,
                provider: example.Provider,
            })),
        }));
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
    async getRemoteDetails(name: string): Promise<RCloneRemoteConfig> {
        const config = (await this.getRemoteConfig(name)) || {};
        return config as RCloneRemoteConfig;
    }

    /**
     * Get configuration of a remote
     */
    async getRemoteConfig(name: string): Promise<RCloneRemoteConfig> {
        return this.callRcloneApi('config/get', { name });
    }

    /**
     * Create a new remote configuration
     */
    async createRemote(name: string, type: string, parameters: Record<string, any> = {}): Promise<any> {
        // Structure the payload as expected by Rclone API
        const params = {
            name,
            type,
            parameters: parameters, // Nest the parameters object under the 'parameters' key
        };

        this.logger.log(
            `Creating new remote: ${name} of type: ${type} with params: ${JSON.stringify(params)}`
        ); // Added params logging
        const result = await this.callRcloneApi('config/create', params);
        // console.log('Result was: ', result); // Result is usually empty on success, potentially remove
        this.logger.log(`Successfully created remote: ${name}`); // Improved success log
        return result; // Rclone 'config/create' usually returns an empty object on success
    }

    /**
     * Update an existing remote configuration
     */
    async updateRemote(name: string, parameters: Record<string, any> = {}): Promise<any> {
        const params = {
            name,
            ...parameters,
        };

        this.logger.log(`Updating remote: ${name}`);
        return this.callRcloneApi('config/update', params);
    }

    /**
     * Delete a remote configuration
     */
    async deleteRemote(name: string): Promise<any> {
        this.logger.log(`Deleting remote: ${name}`);
        return this.callRcloneApi('config/delete', { name });
    }

    /**
     * Start a backup operation using sync/copy
     * This copies a directory from source to destination
     */
    async startBackup(
        srcPath: string,
        dstPath: string,
        options: Record<string, any> = {}
    ): Promise<any> {
        this.logger.log(`Starting backup from ${srcPath} to ${dstPath}`);
        const params = {
            srcFs: srcPath,
            dstFs: dstPath,
            ...options,
        };

        return this.callRcloneApi('sync/copy', params);
    }

    /**
     * Get the status of a running job
     */
    async getJobStatus(jobId: string): Promise<any> {
        return this.callRcloneApi('job/status', { jobid: jobId });
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
            this.logger.debug(`Calling RClone API: ${url} with params: ${JSON.stringify(params)}`);

            const response = await got.post(url, {
                json: params,
                responseType: 'json',
                enableUnixSockets: true,
                headers: {
                    Authorization: `Basic ${Buffer.from(`${this.rcloneUsername}:${this.rclonePassword}`).toString('base64')}`,
                },
                // Add timeout? retry logic? Consider these based on need.
            });

            return response.body;
        } catch (error: unknown) {
            let detailedErrorMessage = 'An unknown error occurred';
            if (error instanceof HTTPError) {
                const statusCode = error.response.statusCode;
                let rcloneError = 'Could not extract Rclone error details.';
                const responseBody = error.response.body; // Get the body

                try {
                    let errorBody: any;
                    // Check if the body is a string that needs parsing or already an object
                    if (typeof responseBody === 'string') {
                        errorBody = JSON.parse(responseBody);
                    } else if (typeof responseBody === 'object' && responseBody !== null) {
                        errorBody = responseBody; // It's already an object
                    }

                    if (errorBody && errorBody.error) {
                        rcloneError = `Rclone Error: ${errorBody.error}`;
                        // Add input details if available, check for different structures
                        if (errorBody.input) {
                            rcloneError += ` | Input: ${JSON.stringify(errorBody.input)}`;
                        } else if (params) {
                            // Fallback to original params if errorBody.input is missing
                            rcloneError += ` | Original Params: ${JSON.stringify(params)}`;
                        }
                    } else if (responseBody) {
                        // Body exists but doesn't match expected error structure
                        rcloneError = `Non-standard error response body: ${typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)}`;
                    } else {
                        rcloneError = 'Empty error response body received.';
                    }
                } catch (parseOrAccessError) {
                    // Handle errors during parsing or accessing properties
                    rcloneError = `Failed to process error response body. Raw body: ${typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)}`;
                }
                // Construct the detailed message for the new error
                detailedErrorMessage = `Rclone API Error (${endpoint}, HTTP ${statusCode}): ${rcloneError}`;

                // Log the detailed error including the original stack if available
                this.logger.error(
                    `Original ${detailedErrorMessage} | Params: ${JSON.stringify(params)}`,
                    error.stack // Log the original HTTPError stack
                );

                // Throw a NEW error with the detailed Rclone message
                throw new Error(detailedErrorMessage);
            } else if (error instanceof Error) {
                // For non-HTTP errors, log and re-throw as before
                detailedErrorMessage = `Error calling RClone API (${endpoint}) with params ${JSON.stringify(params)}: ${error.message}`;
                this.logger.error(detailedErrorMessage, error.stack);
                throw error; // Re-throw original non-HTTP error
            } else {
                // Handle unknown error types
                detailedErrorMessage = `Unknown error calling RClone API (${endpoint}) with params ${JSON.stringify(params)}: ${String(error)}`;
                this.logger.error(detailedErrorMessage);
                throw new Error(detailedErrorMessage); // Throw a new error for unknown types
            }
        }
    }
}
