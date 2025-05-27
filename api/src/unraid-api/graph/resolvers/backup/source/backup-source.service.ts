import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

import { v4 as uuidv4 } from 'uuid';

import {
    BackupSourceConfig,
    BackupSourceProcessor,
    BackupSourceProcessorOptions,
    BackupSourceResult,
} from '@app/unraid-api/graph/resolvers/backup/source/backup-source-processor.interface.js';
import { SourceType } from '@app/unraid-api/graph/resolvers/backup/source/backup-source.types.js';
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

export interface BackupSourceOptions {
    jobId?: string;
    onProgress?: (progress: number) => void;
    onOutput?: (data: string) => void;
    onError?: (error: string) => void;
}

@Injectable()
export class BackupSourceService extends EventEmitter {
    private readonly logger = new Logger(BackupSourceService.name);

    constructor(
        private readonly flashSourceProcessor: FlashSourceProcessor,
        private readonly rawSourceProcessor: RawSourceProcessor,
        private readonly scriptSourceProcessor: ScriptSourceProcessor,
        private readonly zfsSourceProcessor: ZfsSourceProcessor
    ) {
        super();
    }

    async processSource<T extends BackupSourceConfig & { type: SourceType }>(
        config: T,
        options?: BackupSourceOptions
    ): Promise<BackupSourceResult> {
        const processor = this.getProcessor(config.type);
        if (!processor) {
            throw new BadRequestException(`Unsupported source type: ${config.type}`);
        }

        const processorOptions: BackupSourceProcessorOptions = {
            jobId: options?.jobId || uuidv4(),
            onProgress: options?.onProgress,
            onOutput: options?.onOutput,
            onError: options?.onError,
        };

        try {
            const result = await processor.execute(config, processorOptions);
            this.logger.log(`Source processing completed for type: ${config.type}`);
            return result;
        } catch (error) {
            this.logger.error(`Source processing failed for type: ${config.type}`, error);
            throw error;
        }
    }

    async cancelSourceJob(jobId: string): Promise<boolean> {
        this.logger.log(`Attempting to cancel source job: ${jobId}`);
        return false;
    }

    async cleanup(): Promise<void> {
        this.logger.log('Cleaning up source service...');
    }

    public getProcessor(type: SourceType): BackupSourceProcessor<any> | null {
        switch (type) {
            case SourceType.FLASH:
                return this.flashSourceProcessor;
            case SourceType.RAW:
                return this.rawSourceProcessor;
            case SourceType.SCRIPT:
                return this.scriptSourceProcessor;
            case SourceType.ZFS:
                return this.zfsSourceProcessor;
            default:
                return null;
        }
    }
}
