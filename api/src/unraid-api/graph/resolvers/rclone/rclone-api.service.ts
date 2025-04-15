import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import crypto from 'crypto';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';



import { execa } from 'execa';
import got from 'got';



import { RCloneProvider, RCloneProviderOption, RCloneProviderOptionExample, RCloneProviderOptionResponse, RCloneProviderResponse, RCloneProviderTypes } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';





@Injectable()
export class RCloneApiService implements OnModuleInit, OnModuleDestroy {
    private isInitialized: boolean = false;
    private readonly logger = new Logger(RCloneApiService.name);
    private rcloneSocketPath: string = '';
    private rcloneBaseUrl: string = '';
    private rcloneUsername: string = 'unraid-rclone';
    private rclonePassword: string = crypto.randomBytes(32).toString('hex');
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
            this.rcloneBaseUrl = `http://unix:${this.rcloneSocketPath}:/`;

            const socketRunning = await this.checkRcloneSocket(this.rcloneSocketPath);
            if (!socketRunning) {
                this.startRcloneSocket(this.rcloneSocketPath, logFilePath);
            }
            this.isInitialized = true;
        } catch (error: unknown) {
            this.logger.error(`Error initializing FlashBackupService: ${error}`);
            this.isInitialized = false;
        }
    }

    async onModuleDestroy(): Promise<void> {
        if (this.isInitialized) {
            await this.stopRcloneSocket(this.rcloneSocketPath);
        }
        this.logger.log('FlashBackupService module destroyed');
    }

    /**
     * Starts the RClone RC daemon on the specified socket path
     */
    private async startRcloneSocket(socketPath: string, logFilePath: string): Promise<void> {
        // Make log file exists
        if (!existsSync(logFilePath)) {
            this.logger.debug(`Creating log file: ${logFilePath}`);
            await mkdir(dirname(logFilePath), { recursive: true });
            await writeFile(logFilePath, '', 'utf-8');
        }
        this.logger.log(`Starting RClone RC daemon on socket: ${socketPath}`);
        await execa('rclone', [
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
            '--rc-web-gui',
            '--rc-web-gui-no-open-browser',
        ]);
    }

    private async stopRcloneSocket(socketPath: string): Promise<void> {
        this.logger.log(`Stopping RClone RC daemon on socket: ${socketPath}`);
        execa('rclone', ['rcd', '--rc-addr', socketPath, '--stop']);
    }

    /**
     * Checks if the RClone socket exists and is running
     */
    private async checkRcloneSocket(socketPath: string): Promise<boolean> {
        const socketExists = existsSync(socketPath);
        if (!socketExists) {
            this.logger.warn(`RClone socket does not exist at: ${socketPath}`);
            return false;
        }
        try {
            const socketIsRunning = await execa('rclone', ['about']);
            return socketIsRunning.exitCode === 0;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error checking RClone socket: ${errorMessage}`);
            return false;
        }
    }

    /**
     * Get providers supported by RClone
     */
    async getProviders(): Promise<RCloneProviderResponse[]> {
        const response = await this.callRcloneApi('config/providers') as { providers: RCloneProviderResponse[] };
        return response?.providers || [];
    }

    /**
     * Maps RClone provider options from API format to our model format
     */
    private mapProviderOptions(options: RCloneProviderOptionResponse[]): RCloneProviderOption[] {
        return options.map(option => ({
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
            examples: option.Examples?.map(example => ({
                value: example.Value,
                help: example.Help,
                provider: example.Provider,
            })),
        }));
    }

    /**
     * List all configured remotes
     */
    async listRemotes(): Promise<string[]> {
        const response = await this.callRcloneApi('config/listremotes');
        return response.remotes || [];
    }

    /**
     * Get detailed config for a specific remote
     */
    async getRemoteConfig(name: string): Promise<any> {
        return this.callRcloneApi('config/get', { name });
    }

    /**
     * Create a new remote configuration
     */
    async createRemote(name: string, type: string, parameters: Record<string, any> = {}): Promise<any> {
        // Combine the required parameters for the create request
        const params = {
            name,
            type,
            ...parameters,
        };

        this.logger.log(`Creating new remote: ${name} of type: ${type}`);
        return this.callRcloneApi('config/create', params);
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
        try {
            const url = `${this.rcloneBaseUrl}/${endpoint}`;
            this.logger.debug(`Calling RClone API: ${url} with params: ${JSON.stringify(params)}`);

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
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error calling RClone API (${endpoint}): ${errorMessage} ${error}`);
            throw error;
        }
    }

    async serveWebGui(): Promise<{ url: string; username: string; password: string }> {
        if (!this.isInitialized) {
            throw new Error('RClone service is not initialized');
        }

        return {
            url: this.rcloneBaseUrl,
            username: this.rcloneUsername,
            password: this.rclonePassword,
        };
    }
}