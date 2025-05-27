import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';

import { execa } from 'execa';

import {
    BackupSourceConfig,
    BackupSourceProcessor,
    BackupSourceProcessorOptions,
    BackupSourceResult,
} from '@app/unraid-api/graph/resolvers/backup/source/backup-source-processor.interface.js';
import { SourceType } from '@app/unraid-api/graph/resolvers/backup/source/backup-source.types.js';
import { ScriptPreprocessConfigInput } from '@app/unraid-api/graph/resolvers/backup/source/script/script-source.types.js';

export interface ScriptSourceConfig extends BackupSourceConfig {
    scriptPath: string;
    scriptArgs?: string[];
    workingDirectory?: string;
    environment?: Record<string, string>;
    outputPath: string;
}

@Injectable()
export class ScriptSourceProcessor extends BackupSourceProcessor<ScriptSourceConfig> {
    readonly sourceType = SourceType.SCRIPT;
    private readonly logger = new Logger(ScriptSourceProcessor.name);
    private readonly tempDir = '/tmp/unraid-script-preprocessing';
    private readonly maxOutputSize = 100 * 1024 * 1024; // 100MB limit

    async execute(
        config: ScriptSourceConfig,
        options?: BackupSourceProcessorOptions
    ): Promise<BackupSourceResult> {
        const startTime = Date.now();

        const validation = await this.validate(config);
        if (!validation.valid) {
            return {
                success: false,
                error: `Script configuration validation failed: ${validation.error}`,
                metadata: { validationError: validation.error, validationWarnings: validation.warnings },
            };
        }

        if (validation.warnings?.length) {
            this.logger.warn(`Script backup warnings: ${validation.warnings.join(', ')}`);
        }

        try {
            await this.ensureTempDirectory();

            const { command, args } = this.buildCommand(config);

            this.logger.log(`Executing script: ${command} ${args.join(' ')}`);

            await this.runScriptWithTimeout(command, args, config.timeout / 1000);

            const outputSize = await this.getFileSize(config.outputPath);
            if (outputSize === 0) {
                throw new Error('Script produced no output');
            }

            if (outputSize > this.maxOutputSize) {
                throw new Error(
                    `Script output too large: ${outputSize} bytes (max: ${this.maxOutputSize})`
                );
            }

            const duration = Date.now() - startTime;
            this.logger.log(
                `Script completed successfully in ${duration}ms, output size: ${outputSize} bytes`
            );

            return {
                success: true,
                outputPath: config.outputPath,
                metadata: {
                    scriptPath: config.scriptPath,
                    duration,
                    outputSize,
                    workingDirectory: config.workingDirectory,
                    scriptArgs: config.scriptArgs,
                    validationWarnings: validation.warnings,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Script backup failed: ${errorMessage}`);

            try {
                await fs.unlink(config.outputPath);
            } catch {
                // Ignore cleanup errors
            }

            return {
                success: false,
                error: errorMessage,
                metadata: {
                    scriptPath: config.scriptPath,
                    duration: Date.now() - startTime,
                    workingDirectory: config.workingDirectory,
                    scriptArgs: config.scriptArgs,
                },
            };
        }
    }

    async validate(
        config: ScriptSourceConfig
    ): Promise<{ valid: boolean; error?: string; warnings?: string[] }> {
        try {
            await fs.access(config.scriptPath, fs.constants.F_OK | fs.constants.X_OK);

            const restrictedPaths = ['/boot', '/mnt/user', '/mnt/disk'];
            const isRestricted = restrictedPaths.some((path) => config.scriptPath.startsWith(path));

            if (isRestricted) {
                return {
                    valid: false,
                    error: 'Script cannot be located in restricted paths (/boot, /mnt/user, /mnt/disk*)',
                };
            }

            if (config.workingDirectory) {
                try {
                    await fs.access(config.workingDirectory, fs.constants.F_OK);
                } catch {
                    return {
                        valid: false,
                        error: `Working directory does not exist: ${config.workingDirectory}`,
                    };
                }
            }

            const outputDir = dirname(config.outputPath);
            try {
                await fs.access(outputDir, fs.constants.F_OK | fs.constants.W_OK);
            } catch {
                return {
                    valid: false,
                    error: `Output directory does not exist or is not writable: ${outputDir}`,
                };
            }

            if (config.scriptArgs) {
                for (const arg of config.scriptArgs) {
                    if (arg.length > 1000) {
                        return {
                            valid: false,
                            error: `Script argument too long (max 1000 characters): ${arg.substring(0, 50)}...`,
                        };
                    }
                }
            }

            return { valid: true };
        } catch {
            return {
                valid: false,
                error: `Script does not exist or is not executable: ${config.scriptPath}`,
            };
        }
    }

    async cleanup(result: BackupSourceResult): Promise<void> {
        if (result.outputPath) {
            await this.cleanupFile(result.outputPath);
        }
    }

    private async ensureTempDirectory(): Promise<void> {
        try {
            await fs.access(this.tempDir);
        } catch {
            await fs.mkdir(this.tempDir, { recursive: true, mode: 0o700 });
        }
    }

    private buildCommand(config: ScriptSourceConfig): { command: string; args: string[] } {
        const command = 'timeout';
        const args = [
            `${config.timeout / 1000}s`,
            'nice',
            '-n',
            '10',
            'ionice',
            '-c',
            '3',
            'bash',
            '-c',
            `cd "${config.workingDirectory || '/tmp'}" && exec "${config.scriptPath}" ${(config.scriptArgs || []).join(' ')}`,
        ];

        return { command, args };
    }

    private async runScriptWithTimeout(
        command: string,
        args: string[],
        timeoutSeconds: number
    ): Promise<void> {
        try {
            await execa(command, args, {
                timeout: timeoutSeconds * 1000,
                stdio: ['ignore', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
                },
                uid: 99, // nobody user
                gid: 99, // nobody group
            });
        } catch (error: any) {
            if (error.timedOut) {
                throw new Error(`Script timeout after ${timeoutSeconds} seconds`);
            }
            if (error.signal) {
                throw new Error(`Script killed by signal: ${error.signal}`);
            }
            if (error.exitCode !== undefined && error.exitCode !== 0) {
                throw new Error(
                    `Script exited with code ${error.exitCode}. stderr: ${error.stderr || ''}`
                );
            }
            throw new Error(`Failed to execute script: ${error.message}`);
        }
    }

    private async getFileSize(filePath: string): Promise<number> {
        try {
            const stats = await fs.stat(filePath);
            return stats.size;
        } catch {
            return 0;
        }
    }

    private async cleanupFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
            this.logger.log(`Cleaned up script output file: ${filePath}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to cleanup script output ${filePath}: ${errorMessage}`);
        }
    }
}
