import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

import {
    BackupDestinationConfig,
    BackupDestinationProcessor,
    BackupDestinationProcessorOptions,
    BackupDestinationResult,
    StreamingDestinationHandle,
} from '@app/unraid-api/graph/resolvers/backup/destination/backup-destination-processor.interface.js';
import { DestinationType } from '@app/unraid-api/graph/resolvers/backup/destination/backup-destination.types.js';
import { SourceType } from '@app/unraid-api/graph/resolvers/backup/source/backup-source.types.js';
import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';

export interface RCloneDestinationConfig extends BackupDestinationConfig {
    remoteName: string;
    remotePath: string;
    transferOptions?: Record<string, unknown>;
    useStreaming?: boolean;
    sourceCommand?: string;
    sourceArgs?: string[];
    sourceType?: SourceType;
}

@Injectable()
export class RCloneDestinationProcessor extends BackupDestinationProcessor<RCloneDestinationConfig> {
    readonly destinationType = DestinationType.RCLONE;
    private readonly logger = new Logger(RCloneDestinationProcessor.name);

    constructor(private readonly rcloneApiService: RCloneApiService) {
        super();
    }

    async execute(
        sourcePath: string,
        config: RCloneDestinationConfig,
        options: BackupDestinationProcessorOptions = {}
    ): Promise<BackupDestinationResult> {
        const { jobId = 'unknown', onProgress, onOutput, onError } = options;

        try {
            this.logger.log(
                `Starting RClone upload job ${jobId} from ${sourcePath} to ${config.remoteName}:${config.remotePath}`
            );

            return await this.executeRegularBackup(sourcePath, config, options);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown RClone error';
            this.logger.error(`RClone upload job ${jobId} failed: ${errorMessage}`, error);

            if (onError) {
                onError(errorMessage);
            }

            return {
                success: false,
                error: errorMessage,
                cleanupRequired: config.cleanupOnFailure,
            };
        }
    }

    private async executeRegularBackup(
        sourcePath: string,
        config: RCloneDestinationConfig,
        options: BackupDestinationProcessorOptions
    ): Promise<BackupDestinationResult> {
        const { jobId, onOutput } = options;

        const result = (await this.rcloneApiService.startBackup({
            srcPath: sourcePath,
            dstPath: `${config.remoteName}:${config.remotePath}`,
            async: false,
            configId: jobId,
            options: config.transferOptions,
        })) as { jobid?: string; jobId?: string };

        if (onOutput) {
            onOutput(`RClone backup started with job ID: ${result.jobid || result.jobId}`);
        }

        return {
            success: true,
            destinationPath: `${config.remoteName}:${config.remotePath}`,
            metadata: {
                jobId: result.jobid || result.jobId,
                remoteName: config.remoteName,
                remotePath: config.remotePath,
                transferOptions: config.transferOptions,
            },
        };
    }

    async validate(
        config: RCloneDestinationConfig
    ): Promise<{ valid: boolean; error?: string; warnings?: string[] }> {
        const warnings: string[] = [];

        if (!config.remoteName) {
            return { valid: false, error: 'Remote name is required' };
        }

        if (!config.remotePath) {
            return { valid: false, error: 'Remote path is required' };
        }

        if (config.useStreaming) {
            if (!config.sourceCommand) {
                return { valid: false, error: 'Source command is required for streaming backups' };
            }
            if (!config.sourceArgs || config.sourceArgs.length === 0) {
                return { valid: false, error: 'Source arguments are required for streaming backups' };
            }
        }

        try {
            const remotes = await this.rcloneApiService.listRemotes();
            if (!remotes.includes(config.remoteName)) {
                return { valid: false, error: `Remote '${config.remoteName}' not found` };
            }
        } catch (error) {
            return { valid: false, error: 'Failed to validate remote configuration' };
        }

        if (config.timeout < 60000) {
            warnings.push('Timeout is less than 1 minute, which may be too short for large uploads');
        }

        return { valid: true, warnings };
    }

    async cleanup(result: BackupDestinationResult): Promise<void> {
        if (!result.cleanupRequired || !result.destinationPath) {
            return;
        }

        try {
            this.logger.log(`Cleaning up failed upload at ${result.destinationPath}`);

            if (result.metadata?.jobId) {
                await this.rcloneApiService.stopJob(result.metadata.jobId as string);
            }
        } catch (error) {
            this.logger.warn(
                `Failed to cleanup destination: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    get supportsStreaming(): boolean {
        return true;
    }

    get getWritableStream(): (
        config: RCloneDestinationConfig,
        jobId: string,
        options?: BackupDestinationProcessorOptions
    ) => Promise<StreamingDestinationHandle> {
        return async (
            config: RCloneDestinationConfig,
            jobId: string,
            options: BackupDestinationProcessorOptions = {}
        ): Promise<StreamingDestinationHandle> => {
            const validation = await this.validate(config);
            if (!validation.valid) {
                const errorMsg = `RClone destination configuration validation failed: ${validation.error}`;
                this.logger.error(`[${jobId}] ${errorMsg}`);
                throw new Error(errorMsg);
            }

            const rcloneDest = `${config.remoteName}:${config.remotePath}`;
            const rcloneArgs = ['rcat', rcloneDest, '--progress'];

            this.logger.log(
                `[${jobId}] Preparing writable stream for rclone rcat to ${rcloneDest} with progress`
            );

            try {
                const rcloneProcess = execa('rclone', rcloneArgs, {});

                const completionPromise = new Promise<BackupDestinationResult>((resolve, reject) => {
                    let stderrOutput = '';
                    let stdoutOutput = '';

                    rcloneProcess.stderr?.on('data', (data) => {
                        const chunk = data.toString();
                        stderrOutput += chunk;
                        this.logger.verbose(`[${jobId}] rclone rcat stderr: ${chunk.trim()}`);

                        const progressMatch = chunk.match(/(\d+)%/);
                        if (progressMatch && progressMatch[1] && options.onProgress) {
                            const percentage = parseInt(progressMatch[1], 10);
                            if (!isNaN(percentage)) {
                                options.onProgress(percentage);
                            }
                        }
                    });

                    rcloneProcess.stdout?.on('data', (data) => {
                        const chunk = data.toString();
                        stdoutOutput += chunk;
                        this.logger.verbose(`[${jobId}] rclone rcat stdout: ${chunk.trim()}`);
                    });

                    rcloneProcess
                        .then((result) => {
                            this.logger.log(
                                `[${jobId}] rclone rcat to ${rcloneDest} completed successfully.`
                            );
                            resolve({
                                success: true,
                                destinationPath: rcloneDest,
                                metadata: { stdout: stdoutOutput, stderr: stderrOutput },
                            });
                        })
                        .catch((error) => {
                            const errorMessage =
                                error.stderr || error.message || 'rclone rcat command failed';
                            this.logger.error(
                                `[${jobId}] rclone rcat to ${rcloneDest} failed: ${errorMessage}`,
                                error.stack
                            );
                            reject({
                                success: false,
                                error: errorMessage,
                                destinationPath: rcloneDest,
                                metadata: { stdout: stdoutOutput, stderr: stderrOutput },
                            });
                        });
                });

                if (!rcloneProcess.stdin) {
                    const errMsg = 'Failed to get stdin stream from rclone process.';
                    this.logger.error(`[${jobId}] ${errMsg}`);
                    throw new Error(errMsg);
                }

                return {
                    stream: rcloneProcess.stdin,
                    completionPromise,
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`[${jobId}] Failed to start rclone rcat process: ${errorMessage}`);
                throw new Error(`Failed to start rclone rcat process: ${errorMessage}`);
            }
        };
    }
}
