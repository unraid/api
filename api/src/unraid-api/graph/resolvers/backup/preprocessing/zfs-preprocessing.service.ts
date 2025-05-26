import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

import {
    PreprocessResult,
    PreprocessType,
    ZfsPreprocessConfigInput,
} from '@app/unraid-api/graph/resolvers/backup/preprocessing/preprocessing.types.js';
import {
    StreamingJobManager,
    StreamingJobOptions,
} from '@app/unraid-api/graph/resolvers/backup/preprocessing/streaming-job-manager.service.js';
import { ZfsValidationService } from '@app/unraid-api/graph/resolvers/backup/preprocessing/zfs-validation.service.js';

@Injectable()
export class ZfsPreprocessingService {
    private readonly logger = new Logger(ZfsPreprocessingService.name);

    constructor(
        private readonly streamingJobManager: StreamingJobManager,
        private readonly zfsValidationService: ZfsValidationService
    ) {}

    async executeZfsPreprocessing(
        config: ZfsPreprocessConfigInput,
        remotePath: string,
        timeout: number = 3600000
    ): Promise<PreprocessResult> {
        // Validate configuration first
        const validationResult = await this.zfsValidationService.validateZfsConfig(config);
        if (!validationResult.isValid) {
            return {
                success: false,
                error: `ZFS configuration validation failed: ${validationResult.errors.join(', ')}`,
                metadata: {
                    validationErrors: validationResult.errors,
                    validationWarnings: validationResult.warnings,
                },
            };
        }

        // Log any warnings
        if (validationResult.warnings.length > 0) {
            this.logger.warn(`ZFS preprocessing warnings: ${validationResult.warnings.join(', ')}`);
        }

        const snapshotName = this.generateSnapshotName(config.datasetName);
        const fullSnapshotPath = `${config.poolName}/${config.datasetName}@${snapshotName}`;

        try {
            await this.createSnapshot(fullSnapshotPath);
            this.logger.log(`Created ZFS snapshot: ${fullSnapshotPath}`);

            const streamingResult = await this.streamSnapshot(
                fullSnapshotPath,
                remotePath,
                config,
                timeout
            );

            if (config.cleanupSnapshots) {
                await this.cleanupSnapshot(fullSnapshotPath);
                this.logger.log(`Cleaned up ZFS snapshot: ${fullSnapshotPath}`);
            }

            return {
                success: true,
                outputPath: streamingResult.remotePath,
                snapshotName: fullSnapshotPath,
                metadata: {
                    snapshotName: fullSnapshotPath,
                    bytesTransferred: streamingResult.bytesTransferred,
                    duration: streamingResult.duration,
                    cleanedUp: config.cleanupSnapshots,
                    validationWarnings: validationResult.warnings,
                    datasetInfo: validationResult.metadata,
                },
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(
                `ZFS preprocessing failed: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined
            );

            if (config.cleanupSnapshots) {
                try {
                    await this.cleanupSnapshot(fullSnapshotPath);
                    this.logger.log(`Cleaned up ZFS snapshot after failure: ${fullSnapshotPath}`);
                } catch (cleanupError: unknown) {
                    const cleanupErrorMessage =
                        cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
                    this.logger.error(`Failed to cleanup snapshot: ${cleanupErrorMessage}`);
                }
            }

            return {
                success: false,
                error: errorMessage,
                snapshotName: fullSnapshotPath,
                cleanupRequired: config.cleanupSnapshots,
                metadata: {
                    snapshotName: fullSnapshotPath,
                    cleanupAttempted: config.cleanupSnapshots,
                },
            };
        }
    }

    private async createSnapshot(snapshotPath: string): Promise<void> {
        try {
            await execa('zfs', ['snapshot', snapshotPath]);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`ZFS snapshot creation failed: ${errorMessage}`);
        }
    }

    private async streamSnapshot(
        snapshotPath: string,
        remotePath: string,
        config: ZfsPreprocessConfigInput,
        timeout: number
    ): Promise<{ remotePath: string; bytesTransferred: number; duration: number }> {
        const zfsSendArgs = ['send', snapshotPath];

        const streamingOptions: StreamingJobOptions = {
            command: 'zfs',
            args: zfsSendArgs,
            timeout,
            onProgress: (progress) => {
                this.logger.debug(`ZFS streaming progress: ${progress}%`);
            },
            onOutput: (data) => {
                this.logger.debug(`ZFS send output: ${data.slice(0, 100)}...`);
            },
            onError: (error) => {
                this.logger.error(`ZFS send error: ${error}`);
            },
        };

        const { jobId, promise } = await this.streamingJobManager.startStreamingJob(
            PreprocessType.ZFS,
            streamingOptions
        );

        try {
            const result = await promise;

            if (!result.success) {
                throw new Error(result.error || 'ZFS streaming failed');
            }

            return {
                remotePath,
                bytesTransferred: 0,
                duration: result.duration,
            };
        } catch (error: unknown) {
            this.streamingJobManager.cancelJob(jobId);
            throw error;
        }
    }

    private async cleanupSnapshot(snapshotPath: string): Promise<void> {
        try {
            await execa('zfs', ['destroy', snapshotPath]);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`ZFS snapshot cleanup failed: ${errorMessage}`);
        }
    }

    private generateSnapshotName(datasetName: string): string {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `backup-${datasetName}-${timestamp}`;
    }
}
