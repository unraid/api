import { Injectable, Logger } from '@nestjs/common';
import { access, mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

import { execa } from 'execa';

import { FlashValidationService } from '@app/unraid-api/graph/resolvers/backup/preprocessing/flash-validation.service.js';
import {
    FlashPreprocessConfigInput,
    PreprocessResult,
    PreprocessType,
} from '@app/unraid-api/graph/resolvers/backup/preprocessing/preprocessing.types.js';
import {
    RCloneApiService,
    StreamingBackupOptions,
} from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';

@Injectable()
export class FlashPreprocessingService {
    private readonly logger = new Logger(FlashPreprocessingService.name);

    constructor(
        private readonly rcloneApiService: RCloneApiService,
        private readonly flashValidationService: FlashValidationService
    ) {}

    async executeFlashPreprocessing(
        config: FlashPreprocessConfigInput,
        remoteName: string,
        remotePath: string,
        timeout: number = 3600000
    ): Promise<PreprocessResult> {
        // Validate configuration first
        const validationResult = await this.flashValidationService.validateFlashConfig(config);
        if (!validationResult.isValid) {
            return {
                success: false,
                error: `Flash configuration validation failed: ${validationResult.errors.join(', ')}`,
                metadata: {
                    validationErrors: validationResult.errors,
                    validationWarnings: validationResult.warnings,
                },
            };
        }

        // Log any warnings
        if (validationResult.warnings.length > 0) {
            this.logger.warn(`Flash preprocessing warnings: ${validationResult.warnings.join(', ')}`);
        }

        const tempGitPath = join(config.flashPath, '.git-backup-temp');
        let gitRepoInitialized = false;

        try {
            // Initialize git repository if needed and includeGitHistory is enabled
            if (config.includeGitHistory) {
                gitRepoInitialized = await this.initializeGitRepository(config.flashPath, tempGitPath);
                if (gitRepoInitialized) {
                    this.logger.log(`Initialized git repository for Flash backup at: ${tempGitPath}`);
                }
            }

            // Stream the Flash backup directly to rclone
            const streamingResult = await this.streamFlashBackup(
                config,
                remoteName,
                remotePath,
                tempGitPath,
                gitRepoInitialized,
                timeout
            );

            // Cleanup temporary git repository
            if (gitRepoInitialized) {
                await this.cleanupTempGitRepo(tempGitPath);
                this.logger.log(`Cleaned up temporary git repository: ${tempGitPath}`);
            }

            return {
                success: true,
                outputPath: `${remoteName}:${remotePath}`,
                metadata: {
                    flashPath: config.flashPath,
                    gitHistoryIncluded: config.includeGitHistory && gitRepoInitialized,
                    additionalPaths: config.additionalPaths,
                    bytesTransferred: streamingResult.bytesTransferred,
                    duration: streamingResult.duration,
                    validationWarnings: validationResult.warnings,
                    flashInfo: validationResult.metadata,
                    jobId: streamingResult.jobId,
                },
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(
                `Flash preprocessing failed: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined
            );

            // Cleanup temporary git repository on failure
            if (gitRepoInitialized) {
                try {
                    await this.cleanupTempGitRepo(tempGitPath);
                    this.logger.log(`Cleaned up temporary git repository after failure: ${tempGitPath}`);
                } catch (cleanupError: unknown) {
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

    private async initializeGitRepository(flashPath: string, tempGitPath: string): Promise<boolean> {
        try {
            // Check if git repository already exists
            const existingGitPath = join(flashPath, '.git');
            const hasExistingRepo = await this.flashValidationService.validateGitRepository(flashPath);

            if (hasExistingRepo) {
                // Copy existing .git directory to temp location
                await execa('cp', ['-r', existingGitPath, tempGitPath]);
                this.logger.log('Copied existing git repository to temporary location');
                return true;
            }

            // Initialize new git repository in temp location
            await mkdir(tempGitPath, { recursive: true });
            await execa('git', ['init'], { cwd: tempGitPath });

            // Create a gitignore file to exclude sensitive files
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

            // Add all files to the repository
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

            // Move .git directory to temp location
            await execa('mv', [join(flashPath, '.git'), tempGitPath]);

            this.logger.log('Initialized new git repository for Flash backup');
            return true;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to initialize git repository: ${errorMessage}`);
            return false;
        }
    }

    private async streamFlashBackup(
        config: FlashPreprocessConfigInput,
        remoteName: string,
        remotePath: string,
        tempGitPath: string,
        includeGit: boolean,
        timeout: number
    ): Promise<{ bytesTransferred?: number; duration: number; jobId?: string }> {
        // Build tar command arguments
        const tarArgs = ['cf', '-'];

        // Add flash directory contents (exclude .git-backup-temp to avoid conflicts)
        tarArgs.push('--exclude=.git-backup-temp', '-C', config.flashPath, '.');

        // Add git repository if available
        if (includeGit) {
            tarArgs.push('-C', dirname(tempGitPath), '.git-backup-temp');
        }

        // Add additional paths if specified
        if (config.additionalPaths && config.additionalPaths.length > 0) {
            for (const additionalPath of config.additionalPaths) {
                try {
                    await access(additionalPath);
                    tarArgs.push('-C', dirname(additionalPath), '.');
                } catch (error: unknown) {
                    this.logger.warn(`Skipping inaccessible additional path: ${additionalPath}`);
                }
            }
        }

        const streamingOptions: StreamingBackupOptions = {
            remoteName,
            remotePath,
            sourceCommand: 'tar',
            sourceArgs: tarArgs,
            preprocessType: PreprocessType.FLASH,
            timeout,
            onProgress: (progress) => {
                this.logger.debug(`Flash backup streaming progress: ${progress}%`);
            },
            onOutput: (data) => {
                this.logger.debug(`Flash backup output: ${data.slice(0, 100)}...`);
            },
            onError: (error) => {
                this.logger.error(`Flash backup error: ${error}`);
            },
        };

        const result = await this.rcloneApiService.startStreamingBackup(streamingOptions);

        if (!result.success) {
            throw new Error(result.error || 'Flash backup streaming failed');
        }

        return {
            bytesTransferred: result.bytesTransferred,
            duration: result.duration,
            jobId: result.jobId,
        };
    }

    private async cleanupTempGitRepo(tempGitPath: string): Promise<void> {
        try {
            await execa('rm', ['-rf', tempGitPath]);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Temporary git repository cleanup failed: ${errorMessage}`);
        }
    }
}
