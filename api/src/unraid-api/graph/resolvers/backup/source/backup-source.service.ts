import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

import { v4 as uuidv4 } from 'uuid';

import {
    BackupSourceConfig,
    BackupSourceProcessor,
    BackupSourceProcessorOptions,
    BackupSourceResult,
} from '@app/unraid-api/graph/resolvers/backup/source/backup-source-processor.interface.js';
import {
    SourceConfigInput,
    SourceType,
    StreamingJobInfo,
} from '@app/unraid-api/graph/resolvers/backup/source/backup-source.types.js';
import {
    FlashSourceConfig,
    FlashSourceProcessor,
} from '@app/unraid-api/graph/resolvers/backup/source/flash/flash-source-processor.service.js';
import {
    RawSourceConfig,
    RawSourceProcessor,
} from '@app/unraid-api/graph/resolvers/backup/source/raw/raw-source-processor.service.js';
import {
    ScriptSourceConfig,
    ScriptSourceProcessor,
} from '@app/unraid-api/graph/resolvers/backup/source/script/script-source-processor.service.js';
import {
    ZfsSourceConfig,
    ZfsSourceProcessor,
} from '@app/unraid-api/graph/resolvers/backup/source/zfs/zfs-source-processor.service.js';
import {
    StreamingJobManager,
    StreamingJobResult,
} from '@app/unraid-api/streaming-jobs/streaming-job-manager.service.js';

export interface BackupSourceOptions {
    jobId?: string;
    onProgress?: (progress: number) => void;
    onOutput?: (data: string) => void;
    onError?: (error: string) => void;
}

@Injectable()
export class BackupSourceService extends EventEmitter {
    private readonly logger = new Logger(BackupSourceService.name);
    private readonly activeSourceJobs = new Map<string, BackupSourceResult>();
    private readonly sourceProcessors = new Map<SourceType, BackupSourceProcessor<any>>();

    constructor(
        private readonly streamingJobManager: StreamingJobManager,
        private readonly zfsSourceProcessor: ZfsSourceProcessor,
        private readonly flashSourceProcessor: FlashSourceProcessor,
        private readonly scriptSourceProcessor: ScriptSourceProcessor,
        private readonly rawSourceProcessor: RawSourceProcessor
    ) {
        super();
        this.initializeProcessors();
        this.setupEventListeners();
    }

    private initializeProcessors(): void {
        this.sourceProcessors.set(SourceType.ZFS, this.zfsSourceProcessor);
        this.sourceProcessors.set(SourceType.FLASH, this.flashSourceProcessor);
        this.sourceProcessors.set(SourceType.SCRIPT, this.scriptSourceProcessor);
        this.sourceProcessors.set(SourceType.RAW, this.rawSourceProcessor);
    }

    async executeBackupSource(
        sourceType: SourceType,
        config: BackupSourceConfig,
        options: BackupSourceOptions = {}
    ): Promise<BackupSourceResult> {
        const jobId = options.jobId || uuidv4();

        try {
            this.logger.log(`Starting backup source job ${jobId} with type: ${sourceType}`);

            const processor = this.sourceProcessors.get(sourceType);
            if (!processor) {
                throw new BadRequestException(`Unsupported backup source type: ${sourceType}`);
            }

            const processorOptions: BackupSourceProcessorOptions = {
                jobId,
                onProgress: options.onProgress,
                onOutput: options.onOutput,
                onError: options.onError,
            };

            const result = await processor.execute(config, processorOptions);

            this.activeSourceJobs.set(jobId, result);
            this.emit('backupSourceCompleted', { jobId, result });

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Backup source job ${jobId} failed: ${errorMessage}`, error);

            const result: BackupSourceResult = {
                success: false,
                error: errorMessage,
            };

            this.activeSourceJobs.set(jobId, result);
            this.emit('backupSourceFailed', { jobId, result, error });

            return result;
        }
    }

    async executeFromLegacyConfig(
        config: SourceConfigInput,
        options: BackupSourceOptions = {}
    ): Promise<BackupSourceResult> {
        const sourceType = this.determineSourceType(config);
        const sourceConfig = this.transformLegacyConfig(config, sourceType);

        return this.executeBackupSource(sourceType, sourceConfig, options);
    }

    private determineSourceType(config: SourceConfigInput): SourceType {
        if (config.zfsConfig) return SourceType.ZFS;
        if (config.flashConfig) return SourceType.FLASH;
        if (config.scriptConfig) return SourceType.SCRIPT;
        if (config.rawConfig) return SourceType.RAW;

        throw new BadRequestException('No valid source configuration provided');
    }

    private transformLegacyConfig(
        config: SourceConfigInput,
        sourceType: SourceType
    ): BackupSourceConfig {
        const baseConfig = {
            timeout: config.timeout || 3600000,
            cleanupOnFailure: config.cleanupOnFailure ?? true,
        };

        switch (sourceType) {
            case SourceType.ZFS:
                if (!config.zfsConfig) throw new BadRequestException('ZFS config required');
                return {
                    ...baseConfig,
                    poolName: config.zfsConfig.poolName,
                    datasetName: config.zfsConfig.datasetName,
                    snapshotPrefix: config.zfsConfig.snapshotPrefix,
                    cleanupSnapshots: config.zfsConfig.cleanupSnapshots,
                    retainSnapshots: config.zfsConfig.retainSnapshots,
                } as ZfsSourceConfig;

            case SourceType.FLASH:
                if (!config.flashConfig) throw new BadRequestException('Flash config required');
                return {
                    ...baseConfig,
                    flashPath: config.flashConfig.flashPath,
                    includeGitHistory: config.flashConfig.includeGitHistory,
                    additionalPaths: config.flashConfig.additionalPaths,
                } as FlashSourceConfig;

            case SourceType.SCRIPT:
                if (!config.scriptConfig) throw new BadRequestException('Script config required');
                return {
                    ...baseConfig,
                    scriptPath: config.scriptConfig.scriptPath,
                    scriptArgs: config.scriptConfig.scriptArgs,
                    workingDirectory: config.scriptConfig.workingDirectory,
                    environment: config.scriptConfig.environment,
                    outputPath: config.scriptConfig.outputPath,
                } as ScriptSourceConfig;

            case SourceType.RAW:
                if (!config.rawConfig) throw new BadRequestException('Raw config required');
                return {
                    ...baseConfig,
                    sourcePath: config.rawConfig.sourcePath,
                    excludePatterns: config.rawConfig.excludePatterns,
                    includePatterns: config.rawConfig.includePatterns,
                } as RawSourceConfig;

            default:
                throw new BadRequestException(`Unsupported source type: ${sourceType}`);
        }
    }

    async cleanup(jobId: string): Promise<void> {
        const result = this.activeSourceJobs.get(jobId);
        if (!result) {
            this.logger.warn(`No backup source result found for cleanup of job ${jobId}`);
            return;
        }

        try {
            if (result.cleanupRequired) {
                const sourceType = this.getSourceTypeFromResult(result);
                const processor = this.sourceProcessors.get(sourceType);
                if (processor) {
                    await processor.cleanup(result);
                }
            }

            this.activeSourceJobs.delete(jobId);
            this.logger.log(`Cleanup completed for backup source job ${jobId}`);
        } catch (error) {
            this.logger.error(`Cleanup failed for job ${jobId}:`, error);
        }
    }

    private getSourceTypeFromResult(result: BackupSourceResult): SourceType {
        if (result.snapshotName) return SourceType.ZFS;
        if (result.metadata?.flashPath) return SourceType.FLASH;
        if (result.metadata?.scriptPath) return SourceType.SCRIPT;
        return SourceType.RAW;
    }

    private setupEventListeners(): void {
        this.streamingJobManager.on('jobStarted', (jobInfo: StreamingJobInfo) => {
            this.emit('streamingJobStarted', jobInfo);
        });

        this.streamingJobManager.on(
            'jobProgress',
            ({ jobId, progress }: { jobId: string; progress: number }) => {
                this.emit('backupSourceProgress', { jobId, progress });
            }
        );

        this.streamingJobManager.on(
            'jobCompleted',
            ({ jobInfo, result }: { jobInfo: StreamingJobInfo; result: StreamingJobResult }) => {
                this.emit('streamingJobCompleted', { jobInfo, result });
            }
        );
    }

    getActiveJobs(): Map<string, BackupSourceResult> {
        return new Map(this.activeSourceJobs);
    }

    getJobResult(jobId: string): BackupSourceResult | undefined {
        return this.activeSourceJobs.get(jobId);
    }

    async cancelJob(jobId: string): Promise<boolean> {
        const cancelled = this.streamingJobManager.cancelJob(jobId);
        if (cancelled) {
            await this.cleanup(jobId);
        }
        return cancelled;
    }

    async cleanupAllJobs(): Promise<void> {
        const jobIds = Array.from(this.activeSourceJobs.keys());
        await Promise.all(jobIds.map((jobId) => this.cleanup(jobId)));
        await this.streamingJobManager.cleanupAllJobs();
    }
}
