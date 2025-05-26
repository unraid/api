import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

import { v4 as uuidv4 } from 'uuid';

import {
    PreprocessConfigValidationService,
    ValidatedPreprocessConfig,
} from '@app/unraid-api/graph/resolvers/backup/preprocessing/preprocessing-validation.service.js';
import {
    PreprocessConfigInput,
    PreprocessResult,
    PreprocessType,
    StreamingJobInfo,
} from '@app/unraid-api/graph/resolvers/backup/preprocessing/preprocessing.types.js';
import {
    StreamingJobManager,
    StreamingJobOptions,
    StreamingJobResult,
} from '@app/unraid-api/graph/resolvers/backup/preprocessing/streaming-job-manager.service.js';

export interface PreprocessingOptions {
    jobId?: string;
    onProgress?: (progress: number) => void;
    onOutput?: (data: string) => void;
    onError?: (error: string) => void;
}

@Injectable()
export class PreprocessingService extends EventEmitter {
    private readonly logger = new Logger(PreprocessingService.name);
    private readonly activePreprocessJobs = new Map<string, PreprocessResult>();

    constructor(
        private readonly validationService: PreprocessConfigValidationService,
        private readonly streamingJobManager: StreamingJobManager
    ) {
        super();
        this.setupEventListeners();
    }

    async executePreprocessing(
        config: PreprocessConfigInput,
        options: PreprocessingOptions = {}
    ): Promise<PreprocessResult> {
        const jobId = options.jobId || uuidv4();

        try {
            this.logger.log(`Starting preprocessing job ${jobId} with type: ${config.type}`);

            const validatedConfig = await this.validationService.validateAndTransform(config);

            if (validatedConfig.type === PreprocessType.NONE) {
                return this.createSuccessResult(jobId, { type: 'none' });
            }

            const result = await this.executePreprocessingByType(validatedConfig, jobId, options);

            this.activePreprocessJobs.set(jobId, result);
            this.emit('preprocessingCompleted', { jobId, result });

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Preprocessing job ${jobId} failed: ${errorMessage}`, error);

            const result = this.createErrorResult(jobId, errorMessage);
            this.activePreprocessJobs.set(jobId, result);
            this.emit('preprocessingFailed', { jobId, result, error });

            if (config.cleanupOnFailure) {
                await this.cleanup(jobId);
            }

            return result;
        }
    }

    private async executePreprocessingByType(
        config: ValidatedPreprocessConfig,
        jobId: string,
        options: PreprocessingOptions
    ): Promise<PreprocessResult> {
        switch (config.type) {
            case PreprocessType.ZFS:
                return this.executeZfsPreprocessing(config, jobId, options);

            case PreprocessType.FLASH:
                return this.executeFlashPreprocessing(config, jobId, options);

            case PreprocessType.SCRIPT:
                return this.executeScriptPreprocessing(config, jobId, options);

            default:
                throw new BadRequestException(`Unsupported preprocessing type: ${config.type}`);
        }
    }

    private async executeZfsPreprocessing(
        config: ValidatedPreprocessConfig,
        jobId: string,
        options: PreprocessingOptions
    ): Promise<PreprocessResult> {
        const zfsConfig = config.config?.zfs;
        if (!zfsConfig) {
            throw new BadRequestException('ZFS configuration is required');
        }

        const snapshotName = `${zfsConfig.snapshotPrefix || 'backup'}-${Date.now()}`;
        const datasetPath = `${zfsConfig.poolName}/${zfsConfig.datasetName}`;
        const fullSnapshotName = `${datasetPath}@${snapshotName}`;

        try {
            const createSnapshotOptions: StreamingJobOptions = {
                command: 'zfs',
                args: ['snapshot', fullSnapshotName],
                timeout: config.timeout * 1000,
                onProgress: options.onProgress,
                onOutput: options.onOutput,
                onError: options.onError,
            };

            const { promise: snapshotPromise } = await this.streamingJobManager.startStreamingJob(
                PreprocessType.ZFS,
                createSnapshotOptions
            );

            const snapshotResult = await snapshotPromise;

            if (!snapshotResult.success) {
                throw new Error(`Failed to create ZFS snapshot: ${snapshotResult.error}`);
            }

            this.logger.log(`Created ZFS snapshot: ${fullSnapshotName}`);

            return this.createSuccessResult(jobId, {
                type: 'zfs',
                snapshotName: fullSnapshotName,
                streamPath: fullSnapshotName,
                cleanupRequired: zfsConfig.cleanupSnapshots,
                metadata: {
                    poolName: zfsConfig.poolName,
                    datasetName: zfsConfig.datasetName,
                    snapshotPrefix: zfsConfig.snapshotPrefix,
                    retainSnapshots: zfsConfig.retainSnapshots,
                },
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown ZFS error';
            this.logger.error(`ZFS preprocessing failed for job ${jobId}: ${errorMessage}`);

            if (config.cleanupOnFailure) {
                await this.cleanupZfsSnapshot(fullSnapshotName);
            }

            throw error;
        }
    }

    private async executeFlashPreprocessing(
        config: ValidatedPreprocessConfig,
        jobId: string,
        options: PreprocessingOptions
    ): Promise<PreprocessResult> {
        const flashConfig = config.config?.flash;
        if (!flashConfig) {
            throw new BadRequestException('Flash configuration is required');
        }

        const gitRepoPath = `${flashConfig.flashPath}/.git`;

        try {
            if (flashConfig.includeGitHistory && !existsSync(gitRepoPath)) {
                const initOptions: StreamingJobOptions = {
                    command: 'git',
                    args: ['init'],
                    cwd: flashConfig.flashPath,
                    timeout: config.timeout * 1000,
                    onProgress: options.onProgress,
                    onOutput: options.onOutput,
                    onError: options.onError,
                };

                const { promise: initPromise } = await this.streamingJobManager.startStreamingJob(
                    PreprocessType.FLASH,
                    initOptions
                );

                const initResult = await initPromise;

                if (!initResult.success) {
                    throw new Error(`Failed to initialize git repository: ${initResult.error}`);
                }

                const addOptions: StreamingJobOptions = {
                    command: 'git',
                    args: ['add', '.'],
                    cwd: flashConfig.flashPath,
                    timeout: config.timeout * 1000,
                    onProgress: options.onProgress,
                    onOutput: options.onOutput,
                    onError: options.onError,
                };

                const { promise: addPromise } = await this.streamingJobManager.startStreamingJob(
                    PreprocessType.FLASH,
                    addOptions
                );

                const addResult = await addPromise;

                if (!addResult.success) {
                    this.logger.warn(`Git add failed, continuing: ${addResult.error}`);
                }

                const commitOptions: StreamingJobOptions = {
                    command: 'git',
                    args: ['commit', '-m', `Backup snapshot ${new Date().toISOString()}`],
                    cwd: flashConfig.flashPath,
                    timeout: config.timeout * 1000,
                    onProgress: options.onProgress,
                    onOutput: options.onOutput,
                    onError: options.onError,
                };

                const { promise: commitPromise } = await this.streamingJobManager.startStreamingJob(
                    PreprocessType.FLASH,
                    commitOptions
                );

                const commitResult = await commitPromise;

                if (!commitResult.success) {
                    this.logger.warn(`Git commit failed, continuing: ${commitResult.error}`);
                }
            }

            this.logger.log(`Flash preprocessing completed for job ${jobId}`);

            return this.createSuccessResult(jobId, {
                type: 'flash',
                streamPath: flashConfig.flashPath,
                cleanupRequired: false,
                metadata: {
                    flashPath: flashConfig.flashPath,
                    includeGitHistory: flashConfig.includeGitHistory,
                    additionalPaths: flashConfig.additionalPaths,
                    gitInitialized: !existsSync(gitRepoPath),
                },
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown Flash error';
            this.logger.error(`Flash preprocessing failed for job ${jobId}: ${errorMessage}`);
            throw error;
        }
    }

    private async executeScriptPreprocessing(
        config: ValidatedPreprocessConfig,
        jobId: string,
        options: PreprocessingOptions
    ): Promise<PreprocessResult> {
        const scriptConfig = config.config?.script;
        if (!scriptConfig) {
            throw new BadRequestException('Script configuration is required');
        }

        try {
            const scriptOptions: StreamingJobOptions = {
                command: scriptConfig.scriptPath,
                args: scriptConfig.scriptArgs || [],
                cwd: scriptConfig.workingDirectory,
                env: scriptConfig.environment,
                timeout: config.timeout * 1000,
                onProgress: options.onProgress,
                onOutput: options.onOutput,
                onError: options.onError,
            };

            const { promise: scriptPromise } = await this.streamingJobManager.startStreamingJob(
                PreprocessType.SCRIPT,
                scriptOptions
            );

            const scriptResult = await scriptPromise;

            if (!scriptResult.success) {
                throw new Error(`Script execution failed: ${scriptResult.error}`);
            }

            this.logger.log(`Script preprocessing completed for job ${jobId}`);

            return this.createSuccessResult(jobId, {
                type: 'script',
                outputPath: scriptConfig.outputPath,
                cleanupRequired: true,
                metadata: {
                    scriptPath: scriptConfig.scriptPath,
                    scriptArgs: scriptConfig.scriptArgs,
                    workingDirectory: scriptConfig.workingDirectory,
                    exitCode: scriptResult.exitCode,
                    duration: scriptResult.duration,
                },
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown Script error';
            this.logger.error(`Script preprocessing failed for job ${jobId}: ${errorMessage}`);

            if (config.cleanupOnFailure && existsSync(scriptConfig.outputPath)) {
                await this.cleanupScriptOutput(scriptConfig.outputPath);
            }

            throw error;
        }
    }

    async cleanup(jobId: string): Promise<void> {
        const result = this.activePreprocessJobs.get(jobId);
        if (!result) {
            this.logger.warn(`No preprocessing result found for cleanup of job ${jobId}`);
            return;
        }

        try {
            if (result.cleanupRequired) {
                switch (result.metadata?.type) {
                    case 'zfs':
                        if (result.snapshotName) {
                            await this.cleanupZfsSnapshot(result.snapshotName);
                        }
                        break;

                    case 'script':
                        if (result.outputPath) {
                            await this.cleanupScriptOutput(result.outputPath);
                        }
                        break;

                    case 'flash':
                        break;
                }
            }

            this.activePreprocessJobs.delete(jobId);
            this.logger.log(`Cleanup completed for preprocessing job ${jobId}`);
        } catch (error) {
            this.logger.error(`Cleanup failed for job ${jobId}:`, error);
        }
    }

    private async cleanupZfsSnapshot(snapshotName: string): Promise<void> {
        try {
            const { promise } = await this.streamingJobManager.startStreamingJob(PreprocessType.ZFS, {
                command: 'zfs',
                args: ['destroy', snapshotName],
                timeout: 30000,
            });

            const result = await promise;

            if (result.success) {
                this.logger.log(`Cleaned up ZFS snapshot: ${snapshotName}`);
            } else {
                this.logger.error(`Failed to cleanup ZFS snapshot ${snapshotName}: ${result.error}`);
            }
        } catch (error) {
            this.logger.error(`Error during ZFS snapshot cleanup: ${error}`);
        }
    }

    private async cleanupScriptOutput(outputPath: string): Promise<void> {
        try {
            if (existsSync(outputPath)) {
                await unlink(outputPath);
                this.logger.log(`Cleaned up script output file: ${outputPath}`);
            }
        } catch (error) {
            this.logger.error(`Failed to cleanup script output ${outputPath}: ${error}`);
        }
    }

    private createSuccessResult(jobId: string, metadata: Record<string, unknown>): PreprocessResult {
        return {
            success: true,
            ...metadata,
            metadata,
        };
    }

    private createErrorResult(jobId: string, error: string): PreprocessResult {
        return {
            success: false,
            error,
            cleanupRequired: false,
        };
    }

    private setupEventListeners(): void {
        this.streamingJobManager.on('jobStarted', (jobInfo: StreamingJobInfo) => {
            this.emit('streamingJobStarted', jobInfo);
        });

        this.streamingJobManager.on(
            'jobProgress',
            ({ jobId, progress }: { jobId: string; progress: number }) => {
                this.emit('preprocessingProgress', { jobId, progress });
            }
        );

        this.streamingJobManager.on(
            'jobCompleted',
            ({ jobInfo, result }: { jobInfo: StreamingJobInfo; result: StreamingJobResult }) => {
                this.emit('streamingJobCompleted', { jobInfo, result });
            }
        );
    }

    getActiveJobs(): Map<string, PreprocessResult> {
        return new Map(this.activePreprocessJobs);
    }

    getJobResult(jobId: string): PreprocessResult | undefined {
        return this.activePreprocessJobs.get(jobId);
    }

    async cancelJob(jobId: string): Promise<boolean> {
        const cancelled = this.streamingJobManager.cancelJob(jobId);
        if (cancelled) {
            await this.cleanup(jobId);
        }
        return cancelled;
    }

    async cleanupAllJobs(): Promise<void> {
        const jobIds = Array.from(this.activePreprocessJobs.keys());
        await Promise.all(jobIds.map((jobId) => this.cleanup(jobId)));
        await this.streamingJobManager.cleanupAllJobs();
    }
}
