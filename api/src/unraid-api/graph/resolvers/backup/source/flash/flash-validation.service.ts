import { Injectable, Logger } from '@nestjs/common';
import { access, constants, readdir, stat } from 'fs/promises';
import { join } from 'path';

import { execa } from 'execa';

import { FlashPreprocessConfigInput } from '@app/unraid-api/graph/resolvers/backup/source/flash/flash-source.types.js';

export interface FlashValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    metadata: {
        flashPathExists?: boolean;
        flashPathMounted?: boolean;
        gitRepoExists?: boolean;
        gitRepoSize?: number | null;
        additionalPathsValid?: boolean[];
        totalSize?: number | null;
        availableSpace?: number | null;
    };
}

@Injectable()
export class FlashValidationService {
    private readonly logger = new Logger(FlashValidationService.name);

    async validateFlashConfig(config: FlashPreprocessConfigInput): Promise<FlashValidationResult> {
        const result: FlashValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            metadata: {},
        };

        try {
            // Validate flash path exists and is accessible
            const flashPathValid = await this.validateFlashPath(config.flashPath);
            result.metadata.flashPathExists = flashPathValid;

            if (!flashPathValid) {
                result.errors.push(
                    `Flash path '${config.flashPath}' does not exist or is not accessible`
                );
                result.isValid = false;
                return result;
            }

            // Check if flash path is mounted
            const isMounted = await this.isFlashMounted(config.flashPath);
            result.metadata.flashPathMounted = isMounted;

            if (!isMounted) {
                result.warnings.push(`Flash path '${config.flashPath}' may not be properly mounted`);
            }

            // Validate git repository if includeGitHistory is enabled
            if (config.includeGitHistory) {
                const gitRepoExists = await this.validateGitRepository(config.flashPath);
                result.metadata.gitRepoExists = gitRepoExists;

                if (!gitRepoExists) {
                    result.warnings.push(
                        `Git repository not found in '${config.flashPath}'. Git history will be skipped.`
                    );
                } else {
                    const gitRepoSize = await this.getGitRepositorySize(config.flashPath);
                    result.metadata.gitRepoSize = gitRepoSize;

                    if (gitRepoSize && gitRepoSize > 100 * 1024 * 1024) {
                        // 100MB
                        result.warnings.push(
                            `Git repository is large (${Math.round(gitRepoSize / 1024 / 1024)}MB). Backup may take longer.`
                        );
                    }
                }
            }

            // Validate additional paths
            if (config.additionalPaths && config.additionalPaths.length > 0) {
                const pathValidations = await Promise.all(
                    config.additionalPaths.map((path) => this.validateAdditionalPath(path))
                );
                result.metadata.additionalPathsValid = pathValidations;

                const invalidPaths = config.additionalPaths.filter(
                    (_, index) => !pathValidations[index]
                );
                if (invalidPaths.length > 0) {
                    result.warnings.push(
                        `Some additional paths are not accessible: ${invalidPaths.join(', ')}`
                    );
                }
            }

            // Calculate total backup size
            const totalSize = await this.calculateTotalBackupSize(config);
            result.metadata.totalSize = totalSize;

            // Check available space
            const availableSpace = await this.getAvailableSpace(config.flashPath);
            result.metadata.availableSpace = availableSpace;

            if (totalSize && availableSpace && totalSize > availableSpace * 0.8) {
                result.warnings.push(
                    'Backup size may be close to available space. Monitor disk usage during backup.'
                );
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            result.errors.push(`Validation failed: ${errorMessage}`);
            result.isValid = false;
        }

        return result;
    }

    async validateFlashPath(flashPath: string): Promise<boolean> {
        try {
            await access(flashPath);
            const stats = await stat(flashPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }

    async isFlashMounted(flashPath: string): Promise<boolean> {
        try {
            // Check if the path is a mount point by comparing device IDs
            const pathStat = await stat(flashPath);
            const parentStat = await stat(join(flashPath, '..'));
            return pathStat.dev !== parentStat.dev;
        } catch {
            return false;
        }
    }

    async validateGitRepository(flashPath: string): Promise<boolean> {
        const gitPath = join(flashPath, '.git');
        try {
            await access(gitPath);
            const stats = await stat(gitPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }

    async getGitRepositorySize(flashPath: string): Promise<number | null> {
        const gitPath = join(flashPath, '.git');
        try {
            const { stdout } = await execa('du', ['-sb', gitPath]);
            const size = parseInt(stdout.split('\t')[0], 10);
            return isNaN(size) ? null : size;
        } catch {
            return null;
        }
    }

    async validateAdditionalPath(path: string): Promise<boolean> {
        try {
            await access(path);
            return true;
        } catch {
            return false;
        }
    }

    async calculateTotalBackupSize(config: FlashPreprocessConfigInput): Promise<number | null> {
        try {
            let totalSize = 0;

            // Get flash directory size
            const { stdout: flashSize } = await execa('du', ['-sb', config.flashPath]);
            totalSize += parseInt(flashSize.split('\t')[0], 10) || 0;

            // Add additional paths if specified
            if (config.additionalPaths) {
                for (const path of config.additionalPaths) {
                    try {
                        const { stdout: pathSize } = await execa('du', ['-sb', path]);
                        totalSize += parseInt(pathSize.split('\t')[0], 10) || 0;
                    } catch (error: unknown) {
                        this.logger.warn(
                            `Failed to get size for additional path ${path}: ${error instanceof Error ? error.message : String(error)}`
                        );
                    }
                }
            }

            return totalSize;
        } catch {
            return null;
        }
    }

    async getAvailableSpace(path: string): Promise<number | null> {
        try {
            const { stdout } = await execa('df', ['-B1', path]);
            const lines = stdout.split('\n');
            if (lines.length > 1) {
                const fields = lines[1].split(/\s+/);
                if (fields.length >= 4) {
                    const available = parseInt(fields[3], 10);
                    return isNaN(available) ? null : available;
                }
            }
            return null;
        } catch {
            return null;
        }
    }

    async checkGitStatus(flashPath: string): Promise<{
        hasUncommittedChanges: boolean;
        currentBranch: string | null;
        lastCommitHash: string | null;
    }> {
        const result = {
            hasUncommittedChanges: false,
            currentBranch: null as string | null,
            lastCommitHash: null as string | null,
        };

        try {
            // Check for uncommitted changes
            const { stdout: statusOutput } = await execa('git', ['status', '--porcelain'], {
                cwd: flashPath,
            });
            result.hasUncommittedChanges = statusOutput.trim().length > 0;

            // Get current branch
            try {
                const { stdout: branchOutput } = await execa(
                    'git',
                    ['rev-parse', '--abbrev-ref', 'HEAD'],
                    { cwd: flashPath }
                );
                result.currentBranch = branchOutput.trim();
            } catch {
                // Ignore branch detection errors
            }

            // Get last commit hash
            try {
                const { stdout: commitOutput } = await execa('git', ['rev-parse', 'HEAD'], {
                    cwd: flashPath,
                });
                result.lastCommitHash = commitOutput.trim();
            } catch {
                // Ignore commit hash detection errors
            }
        } catch {
            // Git commands failed, repository might not be initialized
        }

        return result;
    }
}
