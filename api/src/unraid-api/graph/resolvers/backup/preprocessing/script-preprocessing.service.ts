import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';

import { execa } from 'execa';

import {
    PreprocessResult,
    ScriptPreprocessConfig,
} from '@app/unraid-api/graph/resolvers/backup/preprocessing/preprocessing.types.js';

@Injectable()
export class ScriptPreprocessingService {
    private readonly logger = new Logger(ScriptPreprocessingService.name);
    private readonly tempDir = '/tmp/unraid-script-preprocessing';
    private readonly maxOutputSize = 100 * 1024 * 1024; // 100MB limit

    async executeScript(config: ScriptPreprocessConfig): Promise<PreprocessResult> {
        const startTime = Date.now();

        try {
            await this.ensureTempDirectory();

            const { command, args } = this.buildCommand(config);

            this.logger.log(`Executing script: ${command} ${args.join(' ')}`);

            await this.runScriptWithTimeout(command, args, 3600); // Default 1 hour timeout

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
                },
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Script preprocessing failed: ${errorMessage}`);

            // Cleanup output file on failure
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

    private async ensureTempDirectory(): Promise<void> {
        try {
            await fs.access(this.tempDir);
        } catch {
            await fs.mkdir(this.tempDir, { recursive: true, mode: 0o700 });
        }
    }

    private buildCommand(config: ScriptPreprocessConfig): { command: string; args: string[] } {
        // Sandboxed execution with restricted permissions
        const command = 'timeout';
        const args = [
            '3600s', // 1 hour timeout
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

    async validateScript(config: ScriptPreprocessConfig): Promise<{ valid: boolean; error?: string }> {
        try {
            // Check if script exists and is executable
            await fs.access(config.scriptPath, fs.constants.F_OK | fs.constants.X_OK);

            // Check script is not in restricted locations
            const restrictedPaths = ['/boot', '/mnt/user', '/mnt/disk'];
            const isRestricted = restrictedPaths.some((path) => config.scriptPath.startsWith(path));

            if (isRestricted) {
                return {
                    valid: false,
                    error: 'Script cannot be located in restricted paths (/boot, /mnt/user, /mnt/disk*)',
                };
            }

            // Validate working directory if specified
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

            // Validate output path directory exists
            const outputDir = dirname(config.outputPath);
            try {
                await fs.access(outputDir, fs.constants.F_OK | fs.constants.W_OK);
            } catch {
                return {
                    valid: false,
                    error: `Output directory does not exist or is not writable: ${outputDir}`,
                };
            }

            // Validate script arguments
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
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                valid: false,
                error: `Script validation failed: ${errorMessage}`,
            };
        }
    }

    async cleanup(outputPath: string): Promise<void> {
        await this.cleanupFile(outputPath);
    }

    private async cleanupFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
            this.logger.debug(`Cleaned up file: ${filePath}`);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to cleanup file ${filePath}: ${errorMessage}`);
        }
    }

    async cleanupTempDirectory(): Promise<void> {
        try {
            const files = await fs.readdir(this.tempDir);
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            for (const file of files) {
                const filePath = join(this.tempDir, file);
                try {
                    const stats = await fs.stat(filePath);
                    if (now - stats.mtime.getTime() > maxAge) {
                        await fs.unlink(filePath);
                        this.logger.debug(`Cleaned up old temp file: ${filePath}`);
                    }
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.warn(`Failed to cleanup old temp file ${filePath}: ${errorMessage}`);
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to cleanup temp directory: ${errorMessage}`);
        }
    }
}
