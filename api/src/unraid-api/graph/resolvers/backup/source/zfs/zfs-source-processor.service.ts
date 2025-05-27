import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

import {
    BackupSourceConfig,
    BackupSourceProcessor,
    BackupSourceProcessorOptions,
    BackupSourceResult,
} from '@app/unraid-api/graph/resolvers/backup/source/backup-source-processor.interface.js';
import { SourceType } from '@app/unraid-api/graph/resolvers/backup/source/backup-source.types.js';
import { ZfsPreprocessConfig } from '@app/unraid-api/graph/resolvers/backup/source/zfs/zfs-source.types.js';
import { ZfsValidationService } from '@app/unraid-api/graph/resolvers/backup/source/zfs/zfs-validation.service.js';
import { zfsProgressExtractor } from '@app/unraid-api/streaming-jobs/progress-extractors.js';
import {
    StreamingJobManager,
    StreamingJobOptions,
} from '@app/unraid-api/streaming-jobs/streaming-job-manager.service.js';

export interface ZfsSourceConfig extends BackupSourceConfig {
    poolName: string;
    datasetName: string;
    snapshotPrefix?: string;
    cleanupSnapshots: boolean;
    retainSnapshots?: number;
}

@Injectable()
export class ZfsSourceProcessor extends BackupSourceProcessor<ZfsSourceConfig> {
    readonly sourceType = SourceType.ZFS;
    private readonly logger = new Logger(ZfsSourceProcessor.name);

    constructor(
        private readonly streamingJobManager: StreamingJobManager,
        private readonly zfsValidationService: ZfsValidationService
    ) {
        super();
    }

    async execute(
        config: ZfsSourceConfig,
        options?: BackupSourceProcessorOptions
    ): Promise<BackupSourceResult> {
        const validation = await this.validate(config);
        if (!validation.valid) {
            return {
                success: false,
                error: `ZFS configuration validation failed: ${validation.error}`,
                metadata: { validationError: validation.error, validationWarnings: validation.warnings },
            };
        }

        if (validation.warnings?.length) {
            this.logger.warn(`ZFS backup warnings: ${validation.warnings.join(', ')}`);
        }

        const snapshotName = this.generateSnapshotName(config.datasetName, config.snapshotPrefix);
        const fullSnapshotPath = `${config.poolName}/${config.datasetName}@${snapshotName}`;

        try {
            await this.createSnapshot(fullSnapshotPath);
            this.logger.log(`Created ZFS snapshot: ${fullSnapshotPath}`);

            const streamingResult = await this.streamSnapshot(fullSnapshotPath, config, options);

            if (config.cleanupSnapshots) {
                await this.cleanupSnapshot(fullSnapshotPath);
                this.logger.log(`Cleaned up ZFS snapshot: ${fullSnapshotPath}`);
            }

            return {
                success: true,
                streamPath: fullSnapshotPath,
                snapshotName: fullSnapshotPath,
                metadata: {
                    snapshotName: fullSnapshotPath,
                    bytesTransferred: streamingResult.bytesTransferred,
                    duration: streamingResult.duration,
                    cleanedUp: config.cleanupSnapshots,
                    validationWarnings: validation.warnings,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`ZFS backup failed: ${errorMessage}`, error);

            if (config.cleanupSnapshots) {
                try {
                    await this.cleanupSnapshot(fullSnapshotPath);
                    this.logger.log(`Cleaned up ZFS snapshot after failure: ${fullSnapshotPath}`);
                } catch (cleanupError) {
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

    async validate(
        config: ZfsSourceConfig
    ): Promise<{ valid: boolean; error?: string; warnings?: string[] }> {
        const legacyConfig: ZfsPreprocessConfig = {
            poolName: config.poolName,
            datasetName: config.datasetName,
            snapshotPrefix: config.snapshotPrefix,
            cleanupSnapshots: config.cleanupSnapshots,
            retainSnapshots: config.retainSnapshots,
        };

        const validationResult = await this.zfsValidationService.validateZfsConfig(legacyConfig);

        return {
            valid: validationResult.isValid,
            error: validationResult.errors.length > 0 ? validationResult.errors.join(', ') : undefined,
            warnings: validationResult.warnings,
        };
    }

    async cleanup(result: BackupSourceResult): Promise<void> {
        if (result.snapshotName && result.cleanupRequired) {
            await this.cleanupSnapshot(result.snapshotName);
        }
    }

    private async createSnapshot(snapshotPath: string): Promise<void> {
        try {
            await execa('zfs', ['snapshot', snapshotPath]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`ZFS snapshot creation failed: ${errorMessage}`);
        }
    }

    private async streamSnapshot(
        snapshotPath: string,
        config: ZfsSourceConfig,
        options?: BackupSourceProcessorOptions
    ): Promise<{ bytesTransferred: number; duration: number }> {
        const zfsSendArgs = ['send', snapshotPath];

        const streamingOptions: StreamingJobOptions = {
            command: 'zfs',
            args: zfsSendArgs,
            timeout: config.timeout,
            onProgress: options?.onProgress,
            onOutput: options?.onOutput,
            onError: options?.onError,
        };

        const { jobId, promise } = await this.streamingJobManager.startStreamingJob(
            SourceType.ZFS,
            streamingOptions,
            zfsProgressExtractor
        );

        try {
            const result = await promise;

            if (!result.success) {
                throw new Error(result.error || 'ZFS streaming failed');
            }

            return {
                bytesTransferred: 0,
                duration: result.duration,
            };
        } catch (error) {
            this.streamingJobManager.cancelJob(jobId);
            throw error;
        }
    }

    private async cleanupSnapshot(snapshotPath: string): Promise<void> {
        try {
            await execa('zfs', ['destroy', snapshotPath]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`ZFS snapshot cleanup failed: ${errorMessage}`);
        }
    }

    private generateSnapshotName(datasetName: string, prefix?: string): string {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const snapshotPrefix = prefix || 'backup';
        return `${snapshotPrefix}-${datasetName}-${timestamp}`;
    }
}
