import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

import { v4 as uuidv4 } from 'uuid';

import {
    BackupDestinationConfig,
    BackupDestinationProcessor,
    BackupDestinationProcessorOptions,
    BackupDestinationResult,
} from '@app/unraid-api/graph/resolvers/backup/destination/backup-destination-processor.interface.js';
import { DestinationType } from '@app/unraid-api/graph/resolvers/backup/destination/backup-destination.types.js';
import { RCloneDestinationProcessor } from '@app/unraid-api/graph/resolvers/backup/destination/rclone/rclone-destination-processor.service.js';

export interface BackupDestinationOptions {
    jobId?: string;
    onProgress?: (progress: number) => void;
    onOutput?: (data: string) => void;
    onError?: (error: string) => void;
}

@Injectable()
export class BackupDestinationService extends EventEmitter {
    private readonly logger = new Logger(BackupDestinationService.name);

    constructor(private readonly rcloneDestinationProcessor: RCloneDestinationProcessor) {
        super();
    }

    async processDestination<T extends BackupDestinationConfig & { type: DestinationType }>(
        sourcePath: string,
        config: T,
        options?: BackupDestinationOptions
    ): Promise<BackupDestinationResult> {
        const processor = this.getProcessor(config.type);
        if (!processor) {
            throw new BadRequestException(`Unsupported destination type: ${config.type}`);
        }

        const processorOptions: BackupDestinationProcessorOptions = {
            jobId: options?.jobId || uuidv4(),
            onProgress: options?.onProgress,
            onOutput: options?.onOutput,
            onError: options?.onError,
        };

        try {
            const result = await processor.execute(sourcePath, config, processorOptions);
            this.logger.log(`Destination processing completed for type: ${config.type}`);
            return result;
        } catch (error) {
            this.logger.error(`Destination processing failed for type: ${config.type}`, error);
            throw error;
        }
    }

    async cancelDestinationJob(jobId: string): Promise<boolean> {
        this.logger.log(`Attempting to cancel destination job: ${jobId}`);

        try {
            const result = await this.rcloneDestinationProcessor.execute('', {} as any, { jobId });
            if (result.metadata?.jobId) {
                this.logger.log(`Cancelled destination job: ${jobId}`);
                return true;
            }
        } catch (error) {
            this.logger.warn(`Failed to cancel destination job ${jobId}:`, error);
        }

        return false;
    }

    async cleanup(): Promise<void> {
        this.logger.log('Cleaning up destination service...');
    }

    public getProcessor(type: DestinationType): BackupDestinationProcessor<any> | null {
        switch (type) {
            case DestinationType.RCLONE:
                return this.rcloneDestinationProcessor;
            default:
                return null;
        }
    }
}
