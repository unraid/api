import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

import { getBackupJobGroupId } from '@app/unraid-api/graph/resolvers/backup/backup.utils.js';
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
    destinationPath: string;
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
                `Starting RClone upload job ${jobId} from ${sourcePath} to ${config.remoteName}:${config.destinationPath}`
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
        const { jobId: backupConfigId, onOutput, onProgress, onError } = options;

        if (!backupConfigId) {
            const errorMsg = 'Backup Configuration ID (jobId) is required to start RClone backup.';
            this.logger.error(errorMsg);
            if (onError) {
                onError(errorMsg);
            }
            return {
                success: false,
                error: errorMsg,
                cleanupRequired: config.cleanupOnFailure,
            };
        }

        await this.rcloneApiService.startBackup({
            srcPath: sourcePath,
            dstPath: `${config.remoteName}:${config.destinationPath}`,
            async: true,
            configId: backupConfigId,
            options: config.transferOptions,
        });

        const groupIdToMonitor = getBackupJobGroupId(backupConfigId);

        if (onOutput) {
            onOutput(
                `RClone backup process initiated for group: ${groupIdToMonitor}. Monitoring progress...`
            );
        }

        let jobStatus = await this.rcloneApiService.getEnhancedJobStatus(
            groupIdToMonitor,
            backupConfigId
        );
        this.logger.debug('Rclone Job Status: %o', jobStatus);
        let retries = 0;
        const effectiveTimeout = config.timeout && config.timeout >= 60000 ? config.timeout : 3600000;
        const maxRetries = Math.floor(effectiveTimeout / 5000);

        while (jobStatus && !jobStatus.finished && retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 5000));

            try {
                jobStatus = await this.rcloneApiService.getEnhancedJobStatus(
                    groupIdToMonitor,
                    backupConfigId
                );
                if (jobStatus && onProgress && jobStatus.progressPercentage !== undefined) {
                    onProgress(jobStatus.progressPercentage);
                }
                if (jobStatus && onOutput && jobStatus.stats?.speed) {
                    onOutput(`Group ${groupIdToMonitor} - Transfer speed: ${jobStatus.stats.speed} B/s`);
                }
            } catch (pollError: any) {
                this.logger.warn(
                    `[${backupConfigId}] Error polling group status for ${groupIdToMonitor}: ${(pollError as Error).message}`
                );
            }
            retries++;
        }

        if (!jobStatus) {
            const errorMsg = `Failed to get final job status for RClone group ${groupIdToMonitor}`;
            this.logger.error(`[${backupConfigId}] ${errorMsg}`);
            if (onError) {
                onError(errorMsg);
            }
            return {
                success: false,
                error: errorMsg,
                destinationPath: `${config.remoteName}:${config.destinationPath}`,
                cleanupRequired: config.cleanupOnFailure,
            };
        }

        if (jobStatus.finished && jobStatus.success) {
            if (onProgress) {
                onProgress(100);
            }
            if (onOutput) {
                onOutput(`RClone backup for group ${groupIdToMonitor} completed successfully.`);
            }
            return {
                success: true,
                destinationPath: `${config.remoteName}:${config.destinationPath}`,
                metadata: {
                    groupId: groupIdToMonitor,
                    remoteName: config.remoteName,
                    remotePath: config.destinationPath,
                    transferOptions: config.transferOptions,
                    stats: jobStatus.stats,
                },
            };
        } else {
            let errorMsg: string;
            if (!jobStatus.finished && retries >= maxRetries) {
                errorMsg = `RClone group ${groupIdToMonitor} timed out after ${effectiveTimeout / 1000} seconds.`;
                this.logger.error(`[${backupConfigId}] ${errorMsg}`);
            } else {
                errorMsg = jobStatus.error || `RClone group ${groupIdToMonitor} failed.`;
                this.logger.error(`[${backupConfigId}] ${errorMsg}`, jobStatus.stats?.lastError);
            }

            if (onError) {
                onError(errorMsg);
            }
            return {
                success: false,
                error: errorMsg,
                destinationPath: `${config.remoteName}:${config.destinationPath}`,
                metadata: {
                    groupId: groupIdToMonitor,
                    remoteName: config.remoteName,
                    remotePath: config.destinationPath,
                    transferOptions: config.transferOptions,
                    stats: jobStatus.stats,
                },
                cleanupRequired: config.cleanupOnFailure,
            };
        }
    }

    async validate(
        config: RCloneDestinationConfig
    ): Promise<{ valid: boolean; error?: string; warnings?: string[] }> {
        const warnings: string[] = [];

        if (!config.remoteName) {
            return { valid: false, error: 'Remote name is required' };
        }

        if (!config.destinationPath) {
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

        const idToStop = result.metadata?.groupId || result.metadata?.jobId;

        try {
            this.logger.log(`Cleaning up failed upload at ${result.destinationPath}`);

            if (idToStop) {
                await this.rcloneApiService.stopJob(idToStop as string);
                if (result.metadata?.groupId) {
                    this.logger.log(`Stopped RClone group: ${result.metadata.groupId}`);
                } else if (result.metadata?.jobId) {
                    this.logger.log(
                        `Attempted to stop RClone job: ${result.metadata.jobId} (Note: Group ID preferred for cleanup)`
                    );
                }
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

            const rcloneDest = `${config.remoteName}:${config.destinationPath}`;
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
