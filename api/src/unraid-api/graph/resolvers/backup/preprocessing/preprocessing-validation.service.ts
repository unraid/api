import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { existsSync } from 'fs';
import { access, constants } from 'fs/promises';

import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { execa } from 'execa';

import {
    FlashPreprocessConfigInput,
    PreprocessConfigInput,
    PreprocessType,
    ScriptPreprocessConfigInput,
    ZfsPreprocessConfigInput,
} from '@app/unraid-api/graph/resolvers/backup/preprocessing/preprocessing.types.js';

export interface ValidatedPreprocessConfig {
    type: PreprocessType;
    config?: {
        zfs?: ZfsPreprocessConfigInput;
        flash?: FlashPreprocessConfigInput;
        script?: ScriptPreprocessConfigInput;
    };
    timeout: number;
    cleanupOnFailure: boolean;
}

@Injectable()
export class PreprocessConfigValidationService {
    private readonly logger = new Logger(PreprocessConfigValidationService.name);

    async validateAndTransform(input: PreprocessConfigInput): Promise<ValidatedPreprocessConfig> {
        const dto = plainToClass(PreprocessConfigInput, input);
        const validationErrors = await validate(dto);

        if (validationErrors.length > 0) {
            const errorMessages = this.formatValidationErrors(validationErrors);
            throw new BadRequestException(`Validation failed: ${errorMessages}`);
        }

        const businessErrors = this.validateBusinessRules(dto);
        if (businessErrors.length > 0) {
            throw new BadRequestException(`Configuration errors: ${businessErrors.join('; ')}`);
        }

        await this.validateAsyncRules(dto);

        return this.transformToValidatedConfig(dto);
    }

    private formatValidationErrors(errors: ValidationError[]): string {
        return errors
            .map((error) => {
                const constraints = error.constraints || {};
                return Object.values(constraints).join(', ');
            })
            .join('; ');
    }

    private validateBusinessRules(dto: PreprocessConfigInput): string[] {
        const errors: string[] = [];

        if (dto.type !== PreprocessType.NONE) {
            if (!dto.zfsConfig && !dto.flashConfig && !dto.scriptConfig) {
                errors.push('Preprocessing configuration is required when type is not "none"');
            }
        }

        if (dto.type === PreprocessType.ZFS && !dto.zfsConfig) {
            errors.push('ZFS configuration is required when type is "zfs"');
        }

        if (dto.type === PreprocessType.FLASH && !dto.flashConfig) {
            errors.push('Flash configuration is required when type is "flash"');
        }

        if (dto.type === PreprocessType.SCRIPT && !dto.scriptConfig) {
            errors.push('Script configuration is required when type is "script"');
        }

        if (dto.type === PreprocessType.ZFS && dto.zfsConfig) {
            errors.push(...this.validateZfsConfig(dto.zfsConfig));
        }

        if (dto.type === PreprocessType.FLASH && dto.flashConfig) {
            errors.push(...this.validateFlashConfig(dto.flashConfig));
        }

        if (dto.type === PreprocessType.SCRIPT && dto.scriptConfig) {
            errors.push(...this.validateScriptConfig(dto.scriptConfig));
        }

        return errors;
    }

    private validateZfsConfig(config: ZfsPreprocessConfigInput): string[] {
        const errors: string[] = [];

        if (config.poolName.includes('..') || config.poolName.startsWith('/')) {
            errors.push('Invalid ZFS pool name format');
        }

        if (config.datasetName.includes('..') || config.datasetName.includes('//')) {
            errors.push('Invalid ZFS dataset name format');
        }

        if (config.retainSnapshots && config.retainSnapshots < 1) {
            errors.push('Retain snapshots must be at least 1');
        }

        return errors;
    }

    private validateFlashConfig(config: FlashPreprocessConfigInput): string[] {
        const errors: string[] = [];

        if (!config.flashPath.startsWith('/')) {
            errors.push('Flash path must be an absolute path');
        }

        if (config.additionalPaths) {
            for (const path of config.additionalPaths) {
                if (!path.startsWith('/')) {
                    errors.push(`Additional path "${path}" must be an absolute path`);
                }
            }
        }

        return errors;
    }

    private validateScriptConfig(config: ScriptPreprocessConfigInput): string[] {
        const errors: string[] = [];

        if (!config.scriptPath.startsWith('/')) {
            errors.push('Script path must be an absolute path');
        }

        if (!config.scriptPath.match(/\.(sh|py|pl|js)$/)) {
            errors.push('Script must have a valid extension (.sh, .py, .pl, .js)');
        }

        if (!config.outputPath.startsWith('/')) {
            errors.push('Output path must be an absolute path');
        }

        if (
            config.scriptArgs?.some((arg) => arg.includes(';') || arg.includes('|') || arg.includes('&'))
        ) {
            errors.push('Script arguments cannot contain shell operators (;, |, &)');
        }

        if (config.workingDirectory && !config.workingDirectory.startsWith('/')) {
            errors.push('Working directory must be an absolute path');
        }

        return errors;
    }

    private async validateAsyncRules(dto: PreprocessConfigInput): Promise<void> {
        if (dto.type === PreprocessType.ZFS && dto.zfsConfig) {
            const poolExists = await this.validateZfsPool(dto.zfsConfig.poolName);
            if (!poolExists) {
                throw new BadRequestException(`ZFS pool '${dto.zfsConfig.poolName}' does not exist`);
            }

            const datasetExists = await this.validateZfsDataset(
                dto.zfsConfig.poolName,
                dto.zfsConfig.datasetName
            );
            if (!datasetExists) {
                throw new BadRequestException(
                    `ZFS dataset '${dto.zfsConfig.poolName}/${dto.zfsConfig.datasetName}' does not exist`
                );
            }
        }

        if (dto.type === PreprocessType.SCRIPT && dto.scriptConfig) {
            const scriptExists = await this.validateScriptExists(dto.scriptConfig.scriptPath);
            if (!scriptExists) {
                throw new BadRequestException(
                    `Script '${dto.scriptConfig.scriptPath}' does not exist or is not executable`
                );
            }
        }

        if (dto.type === PreprocessType.FLASH && dto.flashConfig) {
            const flashPathExists = await this.validateFlashPath(dto.flashConfig.flashPath);
            if (!flashPathExists) {
                throw new BadRequestException(
                    `Flash path '${dto.flashConfig.flashPath}' does not exist`
                );
            }
        }
    }

    async validateZfsPool(poolName: string): Promise<boolean> {
        try {
            const result = await execa('zpool', ['list', '-H', '-o', 'name'], { timeout: 5000 });
            const pools = result.stdout.split('\n').filter((line) => line.trim());
            return pools.includes(poolName);
        } catch (error) {
            this.logger.warn(`Failed to check ZFS pool existence: ${error}`);
            return false;
        }
    }

    async validateZfsDataset(poolName: string, datasetName: string): Promise<boolean> {
        try {
            const fullDatasetName = `${poolName}/${datasetName}`;
            const result = await execa('zfs', ['list', '-H', '-o', 'name', fullDatasetName], {
                timeout: 5000,
            });
            return result.stdout.trim() === fullDatasetName;
        } catch (error) {
            this.logger.warn(`Failed to check ZFS dataset existence: ${error}`);
            return false;
        }
    }

    async validateScriptExists(scriptPath: string): Promise<boolean> {
        try {
            if (!existsSync(scriptPath)) {
                return false;
            }

            await access(scriptPath, constants.F_OK | constants.X_OK);
            return true;
        } catch (error) {
            this.logger.warn(`Failed to validate script: ${error}`);
            return false;
        }
    }

    async validateFlashPath(flashPath: string): Promise<boolean> {
        try {
            await access(flashPath, constants.F_OK | constants.R_OK);
            return true;
        } catch (error) {
            this.logger.warn(`Failed to validate flash path: ${error}`);
            return false;
        }
    }

    private transformToValidatedConfig(dto: PreprocessConfigInput): ValidatedPreprocessConfig {
        const config: ValidatedPreprocessConfig = {
            type: dto.type,
            timeout: dto.timeout,
            cleanupOnFailure: dto.cleanupOnFailure,
        };

        if (dto.type !== PreprocessType.NONE) {
            config.config = {};

            if (dto.zfsConfig) {
                config.config.zfs = dto.zfsConfig;
            }

            if (dto.flashConfig) {
                config.config.flash = dto.flashConfig;
            }

            if (dto.scriptConfig) {
                config.config.script = dto.scriptConfig;
            }
        }

        return config;
    }

    async validatePreprocessingCapabilities(): Promise<{
        zfsAvailable: boolean;
        flashAvailable: boolean;
        scriptingAvailable: boolean;
    }> {
        const [zfsAvailable, flashAvailable] = await Promise.all([
            this.checkZfsAvailability(),
            this.validateFlashPath('/boot'),
        ]);

        return {
            zfsAvailable,
            flashAvailable,
            scriptingAvailable: true,
        };
    }

    private async checkZfsAvailability(): Promise<boolean> {
        try {
            await execa('which', ['zfs'], { timeout: 2000 });
            await execa('which', ['zpool'], { timeout: 2000 });
            return true;
        } catch (error) {
            return false;
        }
    }
}
