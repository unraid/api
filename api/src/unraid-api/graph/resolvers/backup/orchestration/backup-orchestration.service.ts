import { Injectable, Logger } from '@nestjs/common';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises'; // Using stream.pipeline for better error handling

import { BackupJobConfig } from '@app/unraid-api/graph/resolvers/backup/backup.model.js';
import {
    BackupDestinationProcessor,
    BackupDestinationProcessorOptions,
    BackupDestinationResult,
    StreamingDestinationHandle, // Assuming this will be defined in the interface file
} from '@app/unraid-api/graph/resolvers/backup/destination/backup-destination-processor.interface.js';
import { BackupDestinationService } from '@app/unraid-api/graph/resolvers/backup/destination/backup-destination.service.js';
import {
    BackupJobStatus,
    JobStatus,
} from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-job-status.model.js';
import { BackupJobTrackingService } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-job-tracking.service.js';
import {
    BackupSourceProcessor,
    BackupSourceProcessorOptions,
    BackupSourceResult,
} from '@app/unraid-api/graph/resolvers/backup/source/backup-source-processor.interface.js';
import { BackupSourceService } from '@app/unraid-api/graph/resolvers/backup/source/backup-source.service.js';

@Injectable()
export class BackupOrchestrationService {
    private readonly logger = new Logger(BackupOrchestrationService.name);

    constructor(
        private readonly jobTrackingService: BackupJobTrackingService,
        private readonly backupSourceService: BackupSourceService,
        private readonly backupDestinationService: BackupDestinationService
    ) {}

    async executeBackupJob(jobConfig: BackupJobConfig, jobId: string): Promise<void> {
        this.logger.log(`Starting orchestration for backup job: ${jobConfig.name} (ID: ${jobId})`);

        // Initialize job in tracking service and get the internal tracking object
        const jobStatus = this.jobTrackingService.initializeJob(jobId, jobConfig.name);
        const internalJobId = jobStatus.id;

        this.emitJobStatus(internalJobId, {
            status: BackupJobStatus.RUNNING,
            progress: 0,
            message: 'Job initializing...',
        });

        const sourceProcessor = this.backupSourceService.getProcessor(jobConfig.sourceType);
        const destinationProcessor = this.backupDestinationService.getProcessor(
            jobConfig.destinationType
        );

        if (!sourceProcessor || !destinationProcessor) {
            this.logger.error(`[${jobId}] Failed to get source or destination processor.`);
            this.emitJobStatus(internalJobId, {
                status: BackupJobStatus.FAILED,
                error: 'Failed to initialize backup processors.',
            });
            throw new Error('Failed to initialize backup processors.');
        }

        if (sourceProcessor.supportsStreaming && destinationProcessor.supportsStreaming) {
            await this.executeStreamingBackup(
                sourceProcessor,
                destinationProcessor,
                jobConfig,
                internalJobId
            );
        } else {
            await this.executeRegularBackup(
                sourceProcessor,
                destinationProcessor,
                jobConfig,
                internalJobId
            );
        }

        this.logger.log(`Finished orchestration for backup job: ${jobConfig.name} (ID: ${jobId})`);
    }

    private async executeStreamingBackup(
        sourceProcessor: BackupSourceProcessor<any>,
        destinationProcessor: BackupDestinationProcessor<any>,
        jobConfig: BackupJobConfig,
        internalJobId: string
    ): Promise<void> {
        this.logger.log(
            `Executing STREAMING backup for job: ${jobConfig.name} (Internal ID: ${internalJobId})`
        );
        this.emitJobStatus(internalJobId, {
            status: BackupJobStatus.RUNNING,
            progress: 0,
            message: 'Starting streaming backup...',
        });

        if (!sourceProcessor.getReadableStream || !destinationProcessor.getWritableStream) {
            const errorMsg =
                'Source or destination processor does not support streaming (missing getReadableStream or getWritableStream).';
            this.logger.error(`[${internalJobId}] ${errorMsg}`);
            this.emitJobStatus(internalJobId, { status: BackupJobStatus.FAILED, error: errorMsg });
            throw new Error(errorMsg);
        }

        let sourceStream: Readable | null = null;
        let destinationStreamHandle: StreamingDestinationHandle | null = null;

        const processorOptions: BackupDestinationProcessorOptions = {
            jobId: internalJobId,
            onProgress: (progress: number) => {
                this.logger.log(`[${internalJobId}] Destination progress: ${progress}%`);
                this.emitJobStatus(internalJobId, { progress: Math.min(progress, 99) });
            },
            onOutput: (data: string) => {
                this.logger.debug(`[${internalJobId} Dest. Processor Output]: ${data}`);
            },
            onError: (errorMsg: string) => {
                this.logger.warn(`[${internalJobId} Dest. Processor Error]: ${errorMsg}`);
            },
        };

        try {
            this.logger.debug(`[${internalJobId}] Preparing source stream...`);
            sourceStream = await sourceProcessor.getReadableStream(jobConfig.sourceConfig);
            this.logger.debug(
                `[${internalJobId}] Source stream prepared. Preparing destination stream...`
            );
            destinationStreamHandle = await destinationProcessor.getWritableStream(
                jobConfig.destinationConfig,
                internalJobId,
                processorOptions
            );
            this.logger.debug(`[${internalJobId}] Destination stream prepared. Starting stream pipe.`);

            if (!sourceStream || !destinationStreamHandle?.stream) {
                throw new Error('Failed to initialize source or destination stream.');
            }

            let totalBytesProcessed = 0;
            sourceStream.on('data', (chunk) => {
                totalBytesProcessed += chunk.length;
                this.logger.verbose(
                    `[${internalJobId}] Stream data: ${chunk.length} bytes, Total: ${totalBytesProcessed}`
                );
            });

            await pipeline(sourceStream, destinationStreamHandle.stream);

            this.logger.log(
                `[${internalJobId}] Stream piping completed. Waiting for destination processor to finalize...`
            );

            const destinationResult = await destinationStreamHandle.completionPromise;

            if (!destinationResult.success) {
                const errorMsg =
                    destinationResult.error || 'Destination processor failed after streaming.';
                this.logger.error(`[${internalJobId}] ${errorMsg}`);
                throw new Error(errorMsg);
            }

            this.logger.log(
                `Streaming backup job ${jobConfig.name} (Internal ID: ${internalJobId}) completed successfully.`
            );
            this.emitJobStatus(internalJobId, {
                status: BackupJobStatus.COMPLETED,
                progress: 100,
                message: 'Backup completed successfully.',
            });

            if (sourceProcessor.cleanup) {
                this.logger.debug(`[${internalJobId}] Performing post-success cleanup for source...`);
                await sourceProcessor.cleanup({
                    success: true,
                    outputPath: 'streamed',
                    cleanupRequired: false,
                } as any);
            }
            if (destinationProcessor.cleanup) {
                this.logger.debug(
                    `[${internalJobId}] Performing post-success cleanup for destination...`
                );
                await destinationProcessor.cleanup({ success: true, cleanupRequired: false });
            }
        } catch (e) {
            const error = e as Error;
            this.logger.error(
                `Streaming backup job ${jobConfig.name} (Internal ID: ${internalJobId}) failed: ${error.message}`,
                error.stack
            );

            this.emitJobStatus(internalJobId, {
                status: BackupJobStatus.FAILED,
                error: error.message,
                message: 'Backup failed during streaming execution.',
            });

            this.logger.error(
                `[${internalJobId}] Performing cleanup due to failure for job ${jobConfig.name}...`
            );
            try {
                if (sourceProcessor.cleanup) {
                    this.logger.debug(`[${internalJobId}] Cleaning up source processor...`);
                    await sourceProcessor.cleanup({
                        success: false,
                        error: error.message,
                        cleanupRequired: true,
                    } as any);
                }
            } catch (cleanupError) {
                this.logger.error(
                    `[${internalJobId}] Error during source processor cleanup: ${(cleanupError as Error).message}`,
                    (cleanupError as Error).stack
                );
            }

            try {
                if (destinationProcessor.cleanup) {
                    this.logger.debug(`[${internalJobId}] Cleaning up destination processor...`);
                    const destCleanupError =
                        (
                            destinationStreamHandle?.completionPromise &&
                            ((await destinationStreamHandle.completionPromise.catch(
                                (er) => er
                            )) as BackupDestinationResult)
                        )?.error || error.message;
                    await destinationProcessor.cleanup({
                        success: false,
                        error: destCleanupError,
                        cleanupRequired: true,
                    });
                }
            } catch (cleanupError) {
                this.logger.error(
                    `[${internalJobId}] Error during destination processor cleanup: ${(cleanupError as Error).message}`,
                    (cleanupError as Error).stack
                );
            }

            throw error;
        }
    }

    private async executeRegularBackup(
        sourceProcessor: BackupSourceProcessor<any>,
        destinationProcessor: BackupDestinationProcessor<any>,
        jobConfig: BackupJobConfig,
        internalJobId: string
    ): Promise<void> {
        this.logger.log(
            `Executing REGULAR backup for job: ${jobConfig.name} (Internal ID: ${internalJobId})`
        );
        this.emitJobStatus(internalJobId, {
            status: BackupJobStatus.RUNNING,
            progress: 0,
            message: 'Starting regular backup...',
        });

        let sourceResult: BackupSourceResult | null = null;
        let destinationResult: BackupDestinationResult | null = null;

        const processorOptions: BackupSourceProcessorOptions & BackupDestinationProcessorOptions = {
            jobId: internalJobId,
            onProgress: (progressUpdate) => {
                const numericProgress =
                    typeof progressUpdate === 'number'
                        ? progressUpdate
                        : (progressUpdate as any).progress;
                if (typeof numericProgress === 'number') {
                    this.emitJobStatus(internalJobId, { progress: numericProgress });
                }
            },
            onOutput: (data: string) => {
                this.logger.debug(`[${internalJobId} Processor Output]: ${data}`);
            },
            onError: (errorMsg: string) => {
                this.logger.warn(`[${internalJobId} Processor Error]: ${errorMsg}`);
            },
        };

        try {
            this.logger.debug(`[${internalJobId}] Executing source processor...`);
            sourceResult = await sourceProcessor.execute(jobConfig.sourceConfig, processorOptions);
            this.logger.debug(
                `[${internalJobId}] Source processor execution completed. Success: ${sourceResult.success}, OutputPath: ${sourceResult.outputPath}`
            );

            if (!sourceResult.success || !sourceResult.outputPath) {
                const errorMsg =
                    sourceResult.error || 'Source processor failed to produce an output path.';
                this.logger.error(`[${internalJobId}] Source processor failed: ${errorMsg}`);
                this.emitJobStatus(internalJobId, {
                    status: BackupJobStatus.FAILED,
                    error: errorMsg,
                    message: 'Source processing failed.',
                });
                throw new Error(errorMsg);
            }
            this.emitJobStatus(internalJobId, {
                progress: 50,
                message: 'Source processing complete. Starting destination processing.',
            });

            this.logger.debug(
                `[${internalJobId}] Executing destination processor with source output: ${sourceResult.outputPath}...`
            );
            destinationResult = await destinationProcessor.execute(
                sourceResult.outputPath,
                jobConfig.destinationConfig,
                processorOptions
            );
            this.logger.debug(
                `[${internalJobId}] Destination processor execution completed. Success: ${destinationResult.success}`
            );

            if (!destinationResult.success) {
                const errorMsg = destinationResult.error || 'Destination processor failed.';
                this.logger.error(`[${internalJobId}] Destination processor failed: ${errorMsg}`);
                this.emitJobStatus(internalJobId, {
                    status: BackupJobStatus.FAILED,
                    error: errorMsg,
                    message: 'Destination processing failed.',
                });
                throw new Error(errorMsg);
            }

            this.logger.log(
                `Regular backup job ${jobConfig.name} (Internal ID: ${internalJobId}) completed successfully.`
            );
            this.emitJobStatus(internalJobId, {
                status: BackupJobStatus.COMPLETED,
                progress: 100,
                message: 'Backup completed successfully.',
            });

            if (sourceResult && sourceProcessor.cleanup) {
                this.logger.debug(
                    `[${internalJobId}] Performing post-success cleanup for source processor...`
                );
                await sourceProcessor.cleanup(sourceResult);
            }
            if (destinationResult && destinationProcessor.cleanup) {
                this.logger.debug(
                    `[${internalJobId}] Performing post-success cleanup for destination processor...`
                );
                await destinationProcessor.cleanup(destinationResult);
            }
        } catch (e) {
            const error = e as Error;
            this.logger.error(
                `Regular backup job ${jobConfig.name} (Internal ID: ${internalJobId}) failed: ${error.message}`,
                error.stack
            );

            this.emitJobStatus(internalJobId, {
                status: BackupJobStatus.FAILED,
                error: error.message,
                message: 'Backup failed during regular execution.',
            });

            this.logger.error(
                `[${internalJobId}] Performing cleanup due to failure for job ${jobConfig.name}...`
            );
            if (sourceResult && sourceProcessor.cleanup) {
                try {
                    this.logger.debug(
                        `[${internalJobId}] Cleaning up source processor after failure...`
                    );
                    await sourceProcessor.cleanup({
                        ...sourceResult,
                        success: false,
                        error: sourceResult.error || error.message,
                    });
                } catch (cleanupError) {
                    this.logger.error(
                        `[${internalJobId}] Error during source processor cleanup: ${(cleanupError as Error).message}`,
                        (cleanupError as Error).stack
                    );
                }
            }

            if (destinationResult && destinationProcessor.cleanup) {
                try {
                    this.logger.debug(
                        `[${internalJobId}] Cleaning up destination processor after failure...`
                    );
                    await destinationProcessor.cleanup({
                        ...destinationResult,
                        success: false,
                        error: destinationResult.error || error.message,
                    });
                } catch (cleanupError) {
                    this.logger.error(
                        `[${internalJobId}] Error during destination processor cleanup: ${(cleanupError as Error).message}`,
                        (cleanupError as Error).stack
                    );
                }
            } else if (sourceResult?.success && destinationProcessor.cleanup) {
                try {
                    this.logger.debug(
                        `[${internalJobId}] Cleaning up destination processor after a failure (destinationResult not available)...`
                    );
                    await destinationProcessor.cleanup({
                        success: false,
                        error: error.message,
                        cleanupRequired: true,
                    });
                } catch (cleanupError) {
                    this.logger.error(
                        `[${internalJobId}] Error during destination processor cleanup (no result): ${(cleanupError as Error).message}`,
                        (cleanupError as Error).stack
                    );
                }
            }
            throw error;
        }
    }

    private emitJobStatus(
        internalJobId: string,
        statusUpdate: {
            status?: BackupJobStatus;
            progress?: number;
            message?: string;
            error?: string;
        }
    ): void {
        this.logger.log(
            `[Job Status Update - ${internalJobId}]: Status: ${statusUpdate.status}, Progress: ${statusUpdate.progress}, Msg: ${statusUpdate.message}, Err: ${statusUpdate.error}`
        );

        const updatePayload: Partial<Omit<JobStatus, 'externalJobId' | 'startTime' | 'name' | 'id'>> = {
            ...statusUpdate,
        };
        this.jobTrackingService.updateJobStatus(internalJobId, updatePayload);
    }
}
