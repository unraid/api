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

    constructor(private readonly zfsValidationService: ZfsValidationService) {
        super();
    }

    get supportsStreaming(): boolean {
        return true;
    }

    async validate(
        config: ZfsSourceConfig
    ): Promise<{ valid: boolean; error?: string; warnings?: string[] }> {
        try {
            const result = await this.zfsValidationService.validateZfsConfig(config as any);
            return {
                valid: result.isValid,
                error: result.errors.length > 0 ? result.errors.join(', ') : undefined,
                warnings: result.warnings,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { valid: false, error: errorMessage };
        }
    }

    async execute(
        config: ZfsSourceConfig,
        options?: BackupSourceProcessorOptions
    ): Promise<BackupSourceResult> {
        try {
            this.logger.log(`Starting ZFS backup for dataset: ${config.poolName}/${config.datasetName}`);

            const validation = await this.validate(config);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error || 'ZFS validation failed',
                    cleanupRequired: false,
                };
            }

            const snapshotName = await this.createSnapshot(config);
            const snapshotPath = `${config.poolName}/${config.datasetName}@${snapshotName}`;

            this.logger.log(`Created ZFS snapshot: ${snapshotPath}`);

            const result: BackupSourceResult = {
                success: true,
                outputPath: snapshotPath,
                snapshotName,
                cleanupRequired: config.cleanupSnapshots,
                metadata: {
                    poolName: config.poolName,
                    datasetName: config.datasetName,
                    snapshotPath,
                },
            };

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`ZFS backup failed: ${errorMessage}`, error);

            return {
                success: false,
                error: errorMessage,
                cleanupRequired: false,
            };
        }
    }

    async cleanup(result: BackupSourceResult): Promise<void> {
        if (!result.cleanupRequired || !result.snapshotName) {
            return;
        }

        try {
            const snapshotPath = (result.metadata?.snapshotPath as string) || result.outputPath;
            if (snapshotPath && typeof snapshotPath === 'string') {
                await this.destroySnapshot(snapshotPath);
                this.logger.log(`Cleaned up ZFS snapshot: ${snapshotPath}`);
            }
        } catch (error) {
            this.logger.error(`Failed to cleanup ZFS snapshot: ${error}`);
        }
    }

    private async createSnapshot(config: ZfsSourceConfig): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const prefix = config.snapshotPrefix || 'backup';
        const snapshotName = `${prefix}-${timestamp}`;
        const snapshotPath = `${config.poolName}/${config.datasetName}@${snapshotName}`;

        const { stdout, stderr } = await execa('zfs', ['snapshot', snapshotPath]);

        if (stderr) {
            this.logger.warn(`ZFS snapshot creation warning: ${stderr}`);
        }

        this.logger.debug(`ZFS snapshot created: ${stdout}`);
        return snapshotName;
    }

    private async destroySnapshot(snapshotPath: string): Promise<void> {
        const { stdout, stderr } = await execa('zfs', ['destroy', snapshotPath]);

        if (stderr) {
            this.logger.warn(`ZFS snapshot destruction warning: ${stderr}`);
        }

        this.logger.debug(`ZFS snapshot destroyed: ${stdout}`);
    }
}
