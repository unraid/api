import { Injectable, Logger } from '@nestjs/common';
import { access, constants, stat } from 'fs/promises';
import { dirname, isAbsolute, resolve } from 'path';

import { ScriptPreprocessConfigInput } from '@app/unraid-api/graph/resolvers/backup/source/script/script-source.types.js';

export interface ScriptValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    metadata: {
        scriptExists?: boolean;
        scriptExecutable?: boolean;
        workingDirectoryExists?: boolean;
        outputDirectoryExists?: boolean;
        outputDirectoryWritable?: boolean;
        environmentVariablesValid?: boolean;
        resolvedScriptPath?: string;
        resolvedWorkingDirectory?: string;
        resolvedOutputPath?: string;
    };
}

@Injectable()
export class ScriptValidationService {
    private readonly logger = new Logger(ScriptValidationService.name);

    async validateScriptConfig(config: ScriptPreprocessConfigInput): Promise<ScriptValidationResult> {
        const result: ScriptValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            metadata: {},
        };

        try {
            // Resolve and validate script path
            const resolvedScriptPath = this.resolveScriptPath(
                config.scriptPath,
                config.workingDirectory
            );
            result.metadata.resolvedScriptPath = resolvedScriptPath;

            const scriptExists = await this.validateScriptExists(resolvedScriptPath);
            result.metadata.scriptExists = scriptExists;

            if (!scriptExists) {
                result.errors.push(`Script file '${resolvedScriptPath}' does not exist`);
                result.isValid = false;
                return result;
            }

            // Check if script is executable
            const scriptExecutable = await this.validateScriptExecutable(resolvedScriptPath);
            result.metadata.scriptExecutable = scriptExecutable;

            if (!scriptExecutable) {
                result.warnings.push(`Script file '${resolvedScriptPath}' may not be executable`);
            }

            // Validate working directory
            if (config.workingDirectory) {
                const resolvedWorkingDir = resolve(config.workingDirectory);
                result.metadata.resolvedWorkingDirectory = resolvedWorkingDir;

                const workingDirExists = await this.validateDirectory(resolvedWorkingDir);
                result.metadata.workingDirectoryExists = workingDirExists;

                if (!workingDirExists) {
                    result.errors.push(`Working directory '${resolvedWorkingDir}' does not exist`);
                    result.isValid = false;
                }
            }

            // Validate output path and directory
            const resolvedOutputPath = this.resolveOutputPath(
                config.outputPath,
                config.workingDirectory
            );
            result.metadata.resolvedOutputPath = resolvedOutputPath;

            const outputDirectory = dirname(resolvedOutputPath);
            const outputDirExists = await this.validateDirectory(outputDirectory);
            result.metadata.outputDirectoryExists = outputDirExists;

            if (!outputDirExists) {
                result.errors.push(`Output directory '${outputDirectory}' does not exist`);
                result.isValid = false;
            } else {
                // Check if output directory is writable
                const outputDirWritable = await this.validateDirectoryWritable(outputDirectory);
                result.metadata.outputDirectoryWritable = outputDirWritable;

                if (!outputDirWritable) {
                    result.errors.push(`Output directory '${outputDirectory}' is not writable`);
                    result.isValid = false;
                }
            }

            // Validate environment variables
            if (config.environment) {
                const envValid = this.validateEnvironmentVariables(config.environment);
                result.metadata.environmentVariablesValid = envValid;

                if (!envValid) {
                    result.warnings.push('Some environment variables may contain invalid values');
                }
            }

            // Security validations
            this.performSecurityValidations(config, result);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            result.errors.push(`Validation failed: ${errorMessage}`);
            result.isValid = false;
        }

        return result;
    }

    private resolveScriptPath(scriptPath: string, workingDirectory?: string): string {
        if (isAbsolute(scriptPath)) {
            return scriptPath;
        }

        const baseDir = workingDirectory || process.cwd();
        return resolve(baseDir, scriptPath);
    }

    private resolveOutputPath(outputPath: string, workingDirectory?: string): string {
        if (isAbsolute(outputPath)) {
            return outputPath;
        }

        const baseDir = workingDirectory || process.cwd();
        return resolve(baseDir, outputPath);
    }

    async validateScriptExists(scriptPath: string): Promise<boolean> {
        try {
            await access(scriptPath);
            const stats = await stat(scriptPath);
            return stats.isFile();
        } catch {
            return false;
        }
    }

    async validateScriptExecutable(scriptPath: string): Promise<boolean> {
        try {
            const stats = await stat(scriptPath);
            // Check if file has execute permissions (basic check)
            return (stats.mode & parseInt('111', 8)) !== 0;
        } catch {
            return false;
        }
    }

    async validateDirectory(dirPath: string): Promise<boolean> {
        try {
            await access(dirPath);
            const stats = await stat(dirPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }

    async validateDirectoryWritable(dirPath: string): Promise<boolean> {
        try {
            const stats = await stat(dirPath);
            // Check if directory has write permissions (basic check)
            return (stats.mode & parseInt('200', 8)) !== 0;
        } catch {
            return false;
        }
    }

    validateEnvironmentVariables(environment: Record<string, string>): boolean {
        try {
            // Check for potentially dangerous environment variables
            const dangerousVars = ['PATH', 'LD_LIBRARY_PATH', 'HOME', 'USER'];
            const hasDangerousVars = Object.keys(environment).some((key) =>
                dangerousVars.includes(key.toUpperCase())
            );

            if (hasDangerousVars) {
                this.logger.warn('Script environment contains potentially dangerous variables');
            }

            // Check for valid variable names (basic validation)
            const validVarName = /^[A-Za-z_][A-Za-z0-9_]*$/;
            const invalidVars = Object.keys(environment).filter((key) => !validVarName.test(key));

            if (invalidVars.length > 0) {
                this.logger.warn(`Invalid environment variable names: ${invalidVars.join(', ')}`);
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }

    private performSecurityValidations(
        config: ScriptPreprocessConfigInput,
        result: ScriptValidationResult
    ): void {
        // Check for potentially dangerous script paths
        const dangerousPaths = ['/bin', '/usr/bin', '/sbin', '/usr/sbin'];
        const scriptInDangerousPath = dangerousPaths.some((path) =>
            result.metadata.resolvedScriptPath?.startsWith(path)
        );

        if (scriptInDangerousPath) {
            result.warnings.push(
                'Script is located in a system directory. Ensure it is safe to execute.'
            );
        }

        // Check for dangerous script arguments
        if (config.scriptArgs) {
            const dangerousArgs = config.scriptArgs.filter(
                (arg) =>
                    arg.includes('..') ||
                    arg.includes('rm ') ||
                    arg.includes('sudo ') ||
                    arg.includes('su ')
            );

            if (dangerousArgs.length > 0) {
                result.warnings.push(
                    'Script arguments contain potentially dangerous commands or paths.'
                );
            }
        }

        // Check if output path is in a safe location
        if (result.metadata.resolvedOutputPath) {
            const systemPaths = ['/bin', '/usr', '/etc', '/var', '/sys', '/proc'];
            const outputInSystemPath = systemPaths.some((path) =>
                result.metadata.resolvedOutputPath?.startsWith(path)
            );

            if (outputInSystemPath) {
                result.errors.push('Output path cannot be in system directories for security reasons.');
                result.isValid = false;
            }
        }

        // Validate script file extension for common script types
        if (result.metadata.resolvedScriptPath) {
            const scriptExt = result.metadata.resolvedScriptPath.split('.').pop()?.toLowerCase();
            const allowedExtensions = ['sh', 'bash', 'py', 'pl', 'rb', 'js', 'php'];

            if (scriptExt && !allowedExtensions.includes(scriptExt)) {
                result.warnings.push(
                    `Script extension '.${scriptExt}' is not commonly recognized. Ensure it is executable.`
                );
            }
        }
    }

    async getScriptInfo(scriptPath: string): Promise<{
        size: number | null;
        lastModified: Date | null;
        permissions: string | null;
    }> {
        try {
            const stats = await stat(scriptPath);
            return {
                size: stats.size,
                lastModified: stats.mtime,
                permissions: '0' + (stats.mode & parseInt('777', 8)).toString(8),
            };
        } catch {
            return {
                size: null,
                lastModified: null,
                permissions: null,
            };
        }
    }
}
