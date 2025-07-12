import { Injectable, Logger } from '@nestjs/common';
import { access, constants, stat } from 'fs/promises';
import { join } from 'path';

import {
    BackupSourceConfig,
    BackupSourceProcessor,
    BackupSourceProcessorOptions,
    BackupSourceResult,
} from '@app/unraid-api/graph/resolvers/backup/source/backup-source-processor.interface.js';
import { SourceType } from '@app/unraid-api/graph/resolvers/backup/source/backup-source.types.js';
import { RawBackupConfigInput } from '@app/unraid-api/graph/resolvers/backup/source/raw/raw-source.types.js';

export interface RawSourceConfig extends BackupSourceConfig {
    sourcePath: string;
    excludePatterns?: string[];
    includePatterns?: string[];
}

@Injectable()
export class RawSourceProcessor extends BackupSourceProcessor<RawSourceConfig> {
    readonly sourceType = SourceType.RAW;
    private readonly logger = new Logger(RawSourceProcessor.name);

    get supportsStreaming(): boolean {
        return false;
    }

    async execute(
        config: RawSourceConfig,
        options?: BackupSourceProcessorOptions
    ): Promise<BackupSourceResult> {
        const startTime = Date.now();

        try {
            this.logger.log(`Starting RAW backup validation for path: ${config.sourcePath}`);

            const validation = await this.validate(config);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error || 'Validation failed',
                    metadata: {
                        validationError: validation.error,
                        supportsStreaming: this.supportsStreaming,
                    },
                    supportsStreaming: this.supportsStreaming,
                };
            }

            if (validation.warnings?.length) {
                this.logger.warn(
                    `RAW backup warnings for ${config.sourcePath}: ${validation.warnings.join(', ')}`
                );
            }

            const sourceStats = await stat(config.sourcePath);
            const duration = Date.now() - startTime;

            this.logger.log(`RAW backup: Providing direct path for ${config.sourcePath}`);
            return {
                success: true,
                outputPath: config.sourcePath,
                supportsStreaming: this.supportsStreaming,
                isStreamingMode: false,
                metadata: {
                    sourcePath: config.sourcePath,
                    isDirectory: sourceStats.isDirectory(),
                    size: sourceStats.size,
                    duration,
                    excludePatterns: config.excludePatterns,
                    includePatterns: config.includePatterns,
                    validationWarnings: validation.warnings,
                    supportsStreaming: this.supportsStreaming,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(
                `RAW backup preparation failed for ${config.sourcePath}: ${errorMessage}`,
                errorStack
            );

            return {
                success: false,
                error: errorMessage,
                supportsStreaming: this.supportsStreaming,
                metadata: {
                    sourcePath: config.sourcePath,
                    duration: Date.now() - startTime,
                    supportsStreaming: this.supportsStreaming,
                },
            };
        }
    }

    async validate(
        config: RawSourceConfig
    ): Promise<{ valid: boolean; error?: string; warnings?: string[] }> {
        const warnings: string[] = [];

        try {
            await access(config.sourcePath, constants.F_OK | constants.R_OK);
        } catch {
            return {
                valid: false,
                error: `Source path does not exist or is not readable: ${config.sourcePath}`,
            };
        }

        const restrictedPaths = ['/proc', '/sys', '/dev'];
        const isRestricted = restrictedPaths.some((path) => config.sourcePath.startsWith(path));
        if (isRestricted) {
            return {
                valid: false,
                error: `Cannot backup restricted system paths: ${config.sourcePath}`,
            };
        }

        if (config.excludePatterns?.length && config.includePatterns?.length) {
            warnings.push(
                'Both include and exclude patterns specified - exclude patterns take precedence'
            );
        }

        const stats = await stat(config.sourcePath);
        if (stats.isDirectory()) {
            const largeDirPaths = ['/mnt/user', '/mnt/disk'];
            const isLargeDir = largeDirPaths.some((path) => config.sourcePath.startsWith(path));
            if (isLargeDir && !config.excludePatterns?.length && !config.includePatterns?.length) {
                warnings.push(
                    'Backing up large directory without filters may take significant time and space'
                );
            }
        }

        return { valid: true, warnings };
    }

    async cleanup(result: BackupSourceResult): Promise<void> {
        this.logger.log(`RAW backup cleanup completed for: ${result.metadata?.sourcePath}`);
    }
}
