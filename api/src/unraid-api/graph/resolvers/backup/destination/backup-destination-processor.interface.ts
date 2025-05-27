import { Writable } from 'stream';

import { DestinationType } from '@app/unraid-api/graph/resolvers/backup/destination/backup-destination.types.js';

export interface BackupDestinationConfig {
    timeout: number;
    cleanupOnFailure: boolean;
    useStreaming?: boolean;
    supportsStreaming?: boolean;
}

export interface BackupDestinationResult {
    success: boolean;
    destinationPath?: string;
    uploadedBytes?: number;
    error?: string;
    cleanupRequired?: boolean;
    metadata?: Record<string, unknown>;
}

export interface StreamingDestinationHandle {
    stream: Writable;
    completionPromise: Promise<BackupDestinationResult>;
}

export interface BackupDestinationProcessorOptions {
    jobId?: string;
    onProgress?: (progress: number) => void;
    onOutput?: (data: string) => void;
    onError?: (error: string) => void;
}

export abstract class BackupDestinationProcessor<TConfig extends BackupDestinationConfig> {
    abstract readonly destinationType: DestinationType;

    abstract execute(
        sourcePath: string,
        config: TConfig,
        options?: BackupDestinationProcessorOptions
    ): Promise<BackupDestinationResult>;

    abstract validate(config: TConfig): Promise<{ valid: boolean; error?: string; warnings?: string[] }>;

    abstract cleanup(result: BackupDestinationResult): Promise<void>;

    // Getter to check if processor supports streaming
    abstract get supportsStreaming(): boolean;

    // Optional getter to get a writable stream for streaming backups
    get getWritableStream():
        | ((
              config: TConfig,
              jobId: string,
              options?: BackupDestinationProcessorOptions
          ) => Promise<StreamingDestinationHandle>)
        | undefined {
        return undefined;
    }
}
