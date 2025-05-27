import { Readable } from 'stream';

import { SourceType } from '@app/unraid-api/graph/resolvers/backup/source/backup-source.types.js';

export interface BackupSourceConfig {
    timeout: number;
    cleanupOnFailure: boolean;
}

export interface BackupSourceResult {
    success: boolean;
    outputPath?: string;
    streamPath?: string;
    snapshotName?: string;
    error?: string;
    cleanupRequired?: boolean;
    metadata?: Record<string, unknown>;

    // Streaming support
    streamCommand?: string;
    streamArgs?: string[];
    supportsStreaming?: boolean;
    isStreamingMode?: boolean;
}

export interface BackupSourceProcessorOptions {
    jobId?: string;
    onProgress?: (progress: number) => void;
    onOutput?: (data: string) => void;
    onError?: (error: string) => void;
    useStreaming?: boolean;
}

export abstract class BackupSourceProcessor<TConfig extends BackupSourceConfig> {
    abstract readonly sourceType: SourceType;

    abstract execute(
        config: TConfig,
        options?: BackupSourceProcessorOptions
    ): Promise<BackupSourceResult>;

    abstract validate(config: TConfig): Promise<{ valid: boolean; error?: string; warnings?: string[] }>;

    abstract cleanup(result: BackupSourceResult): Promise<void>;

    // Getter to check if processor supports streaming
    abstract get supportsStreaming(): boolean;

    // Optional getter to get a readable stream for streaming backups
    get getReadableStream(): ((config: TConfig) => Promise<Readable>) | undefined {
        return undefined;
    }
}
