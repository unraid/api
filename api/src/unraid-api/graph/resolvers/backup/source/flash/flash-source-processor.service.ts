import { Injectable, Logger } from '@nestjs/common';
import { access, mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { Readable } from 'stream';

import { execa } from 'execa';

import {
    BackupSourceConfig,
    BackupSourceProcessor,
    BackupSourceProcessorOptions,
    BackupSourceResult,
} from '@app/unraid-api/graph/resolvers/backup/source/backup-source-processor.interface.js';
import { SourceType } from '@app/unraid-api/graph/resolvers/backup/source/backup-source.types.js';
import { FlashPreprocessConfigInput } from '@app/unraid-api/graph/resolvers/backup/source/flash/flash-source.types.js';
import { FlashValidationService } from '@app/unraid-api/graph/resolvers/backup/source/flash/flash-validation.service.js';

export interface FlashSourceConfig extends BackupSourceConfig {
    flashPath: string;
    includeGitHistory: boolean;
    additionalPaths?: string[];
}

@Injectable()
export class FlashSourceProcessor extends BackupSourceProcessor<FlashSourceConfig> {
    readonly sourceType = SourceType.FLASH;
    private readonly logger = new Logger(FlashSourceProcessor.name);

    constructor(private readonly flashValidationService: FlashValidationService) {
        super();
    }

    async execute(
        config: FlashSourceConfig,
        options?: BackupSourceProcessorOptions
    ): Promise<BackupSourceResult> {
        const validation = await this.validate(config);
        if (!validation.valid) {
            return {
                success: false,
                error: `Flash configuration validation failed: ${validation.error}`,
                metadata: { validationError: validation.error, validationWarnings: validation.warnings },
            };
        }

        if (validation.warnings?.length) {
            this.logger.warn(`Flash backup warnings: ${validation.warnings.join(', ')}`);
        }

        const tempGitPath = join(config.flashPath, '.git-backup-temp');
        let gitRepoInitialized = false;

        try {
            if (config.includeGitHistory) {
                gitRepoInitialized = await this.initializeGitRepository(config.flashPath, tempGitPath);
                if (gitRepoInitialized) {
                    this.logger.log(`Initialized git repository for Flash backup at: ${tempGitPath}`);
                }
            }

            // Generate streaming command for tar compression
            const streamCommand = this.generateStreamCommand(config, gitRepoInitialized, tempGitPath);

            return {
                success: true,
                outputPath: config.flashPath,
                streamPath: config.flashPath,
                metadata: {
                    flashPath: config.flashPath,
                    gitHistoryIncluded: config.includeGitHistory && gitRepoInitialized,
                    additionalPaths: config.additionalPaths,
                    validationWarnings: validation.warnings,
                    tempGitPath: gitRepoInitialized ? tempGitPath : undefined,
                    streamCommand: streamCommand.command,
                    streamArgs: streamCommand.args,
                    sourceType: this.sourceType,
                },
                cleanupRequired: gitRepoInitialized,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Flash backup failed: ${errorMessage}`, error);

            if (gitRepoInitialized) {
                try {
                    await this.cleanupTempGitRepo(tempGitPath);
                    this.logger.log(`Cleaned up temporary git repository after failure: ${tempGitPath}`);
                } catch (cleanupError) {
                    const cleanupErrorMessage =
                        cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
                    this.logger.error(
                        `Failed to cleanup temporary git repository: ${cleanupErrorMessage}`
                    );
                }
            }

            return {
                success: false,
                error: errorMessage,
                cleanupRequired: gitRepoInitialized,
                metadata: {
                    flashPath: config.flashPath,
                    gitRepoInitialized,
                    cleanupAttempted: gitRepoInitialized,
                },
            };
        }
    }

    async validate(
        config: FlashSourceConfig
    ): Promise<{ valid: boolean; error?: string; warnings?: string[] }> {
        const legacyConfig: FlashPreprocessConfigInput = {
            flashPath: config.flashPath,
            includeGitHistory: config.includeGitHistory,
            additionalPaths: config.additionalPaths,
        };

        const validationResult = await this.flashValidationService.validateFlashConfig(legacyConfig);

        return {
            valid: validationResult.isValid,
            error: validationResult.errors.length > 0 ? validationResult.errors.join(', ') : undefined,
            warnings: validationResult.warnings,
        };
    }

    async cleanup(result: BackupSourceResult): Promise<void> {
        if (result.cleanupRequired && result.metadata?.tempGitPath) {
            await this.cleanupTempGitRepo(result.metadata.tempGitPath as string);
        }
    }

    private async initializeGitRepository(flashPath: string, tempGitPath: string): Promise<boolean> {
        try {
            const existingGitPath = join(flashPath, '.git');
            const hasExistingRepo = await this.flashValidationService.validateGitRepository(flashPath);

            if (hasExistingRepo) {
                await execa('cp', ['-r', existingGitPath, tempGitPath]);
                this.logger.log('Copied existing git repository to temporary location');
                return true;
            }

            await mkdir(tempGitPath, { recursive: true });
            await execa('git', ['init'], { cwd: tempGitPath });

            const gitignorePath = join(tempGitPath, '.gitignore');
            const gitignoreContent = [
                '# Exclude sensitive files',
                '*.key',
                '*.pem',
                '*.p12',
                '*.pfx',
                'config/passwd',
                'config/shadow',
                'config/ssh/',
                'config/ssl/',
                'config/wireguard/',
                'config/network.cfg',
                'config/ident.cfg',
            ].join('\n');

            await writeFile(gitignorePath, gitignoreContent);

            await execa('git', ['add', '.'], { cwd: flashPath });
            await execa(
                'git',
                [
                    '-c',
                    'user.name=Unraid Backup',
                    '-c',
                    'user.email=backup@unraid.net',
                    'commit',
                    '-m',
                    'Flash backup snapshot',
                ],
                { cwd: flashPath }
            );

            await execa('mv', [join(flashPath, '.git'), tempGitPath]);

            this.logger.log('Initialized new git repository for Flash backup');
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to initialize git repository: ${errorMessage}`);
            return false;
        }
    }

    private async cleanupTempGitRepo(tempGitPath: string): Promise<void> {
        try {
            await execa('rm', ['-rf', tempGitPath]);
            this.logger.log(`Cleaned up temporary git repository: ${tempGitPath}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to cleanup temporary git repository: ${errorMessage}`);
        }
    }

    private generateStreamCommand(
        config: FlashSourceConfig,
        gitRepoInitialized: boolean,
        tempGitPath?: string
    ): { command: string; args: string[] } {
        const excludeArgs: string[] = [];

        // Standard exclusions for flash backups
        const standardExcludes = ['lost+found', '*.tmp', '*.temp', '.DS_Store', 'Thumbs.db'];

        standardExcludes.forEach((pattern) => {
            excludeArgs.push('--exclude', pattern);
        });

        // If git repo was initialized, include it in the backup
        if (gitRepoInitialized && tempGitPath) {
            excludeArgs.push('--exclude', '.git-backup-temp');
        }

        const tarArgs = [
            '-czf', // create, gzip, file
            '-', // output to stdout for streaming
            '-C', // change to directory
            config.flashPath,
            ...excludeArgs,
            '.', // backup everything in the directory
        ];

        // Add additional paths if specified
        if (config.additionalPaths?.length) {
            config.additionalPaths.forEach((path) => {
                tarArgs.push('-C', path, '.');
            });
        }

        return {
            command: 'tar',
            args: tarArgs,
        };
    }

    get supportsStreaming(): boolean {
        return true;
    }

    get getReadableStream(): (config: FlashSourceConfig) => Promise<Readable> {
        return async (config: FlashSourceConfig): Promise<Readable> => {
            const validation = await this.validate(config);
            if (!validation.valid) {
                const errorMsg = `Flash configuration validation failed: ${validation.error}`;
                this.logger.error(errorMsg);
                const errorStream = new Readable({
                    read() {
                        this.emit('error', new Error(errorMsg));
                        this.push(null);
                    },
                });
                return errorStream;
            }

            const { command, args } = this.generateStreamCommand(config, false);

            this.logger.log(
                `[getReadableStream] Streaming flash backup with command: ${command} ${args.join(' ')}`
            );

            try {
                const tarProcess = execa(command, args, {
                    cwd: config.flashPath,
                });

                tarProcess.catch((error) => {
                    this.logger.error(
                        `Error executing tar command for streaming: ${error.message}`,
                        error.stack
                    );
                });

                if (!tarProcess.stdout) {
                    throw new Error('Failed to get stdout stream from tar process.');
                }

                tarProcess.stdout.on('end', () => {
                    this.logger.log('[getReadableStream] Tar process stdout stream ended.');
                });
                tarProcess.stdout.on('error', (err) => {
                    this.logger.error(
                        `[getReadableStream] Tar process stdout stream error: ${err.message}`
                    );
                });

                return tarProcess.stdout;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`[getReadableStream] Failed to start tar process: ${errorMessage}`);
                const errorStream = new Readable({
                    read() {
                        this.emit('error', new Error(errorMessage));
                        this.push(null);
                    },
                });
                return errorStream;
            }
        };
    }
}
