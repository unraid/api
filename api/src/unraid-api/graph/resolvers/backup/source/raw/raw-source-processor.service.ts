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

    async execute(
        config: RawSourceConfig,
        options?: BackupSourceProcessorOptions
    ): Promise<BackupSourceResult> {
        const startTime = Date.now();

        try {
            this.logger.log(`Starting RAW backup for path: ${config.sourcePath}`);

            const validation = await this.validate(config);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error || 'Validation failed',
                    metadata: { validationError: validation.error },
                };
            }

            if (validation.warnings?.length) {
                this.logger.warn(`RAW backup warnings: ${validation.warnings.join(', ')}`);
            }

            const sourceStats = await stat(config.sourcePath);
            const duration = Date.now() - startTime;

            return {
                success: true,
                outputPath: config.sourcePath,
                metadata: {
                    sourcePath: config.sourcePath,
                    isDirectory: sourceStats.isDirectory(),
                    size: sourceStats.size,
                    duration,
                    excludePatterns: config.excludePatterns,
                    includePatterns: config.includePatterns,
                    validationWarnings: validation.warnings,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`RAW backup failed: ${errorMessage}`, error);

            return {
                success: false,
                error: errorMessage,
                metadata: {
                    sourcePath: config.sourcePath,
                    duration: Date.now() - startTime,
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
