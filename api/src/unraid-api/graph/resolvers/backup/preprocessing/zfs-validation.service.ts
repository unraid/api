import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

import { ZfsPreprocessConfigInput } from '@app/unraid-api/graph/resolvers/backup/preprocessing/preprocessing.types.js';

export interface ZfsValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    metadata: {
        poolExists?: boolean;
        datasetExists?: boolean;
        datasetSize?: number;
        availableSpace?: number;
        mountpoint?: string;
    };
}

@Injectable()
export class ZfsValidationService {
    private readonly logger = new Logger(ZfsValidationService.name);

    async validateZfsConfig(config: ZfsPreprocessConfigInput): Promise<ZfsValidationResult> {
        const result: ZfsValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            metadata: {},
        };

        try {
            // Validate pool exists
            const poolExists = await this.validatePool(config.poolName);
            result.metadata.poolExists = poolExists;

            if (!poolExists) {
                result.errors.push(`ZFS pool '${config.poolName}' does not exist`);
                result.isValid = false;
                return result;
            }

            // Validate dataset exists
            const datasetExists = await this.validateDataset(config.poolName, config.datasetName);
            result.metadata.datasetExists = datasetExists;

            if (!datasetExists) {
                result.errors.push(
                    `ZFS dataset '${config.poolName}/${config.datasetName}' does not exist`
                );
                result.isValid = false;
                return result;
            }

            // Get dataset information
            const datasetInfo = await this.getDatasetInfo(config.poolName, config.datasetName);
            result.metadata = { ...result.metadata, ...datasetInfo };

            // Validate dataset is mounted
            if (!datasetInfo.mountpoint || datasetInfo.mountpoint === 'none') {
                result.warnings.push(
                    `Dataset '${config.poolName}/${config.datasetName}' is not mounted`
                );
            }

            // Check available space for snapshots
            if (datasetInfo.availableSpace && datasetInfo.datasetSize) {
                const spaceRatio = datasetInfo.availableSpace / datasetInfo.datasetSize;
                if (spaceRatio < 0.1) {
                    result.warnings.push(
                        'Low available space for snapshot creation (less than 10% of dataset size)'
                    );
                }
            }

            // Validate snapshot retention settings
            if (config.retainSnapshots && config.retainSnapshots < 1) {
                result.errors.push('Retain snapshots must be at least 1');
                result.isValid = false;
            }

            // Check for existing snapshots if cleanup is disabled
            if (!config.cleanupSnapshots) {
                const existingSnapshots = await this.getExistingSnapshots(
                    config.poolName,
                    config.datasetName,
                    config.snapshotPrefix
                );
                if (existingSnapshots.length > 10) {
                    result.warnings.push(
                        `Found ${existingSnapshots.length} existing snapshots. Consider enabling cleanup.`
                    );
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            result.errors.push(`Validation failed: ${errorMessage}`);
            result.isValid = false;
        }

        return result;
    }

    async validatePool(poolName: string): Promise<boolean> {
        try {
            await execa('zpool', ['list', '-H', '-o', 'name', poolName]);
            return true;
        } catch {
            return false;
        }
    }

    async validateDataset(poolName: string, datasetName: string): Promise<boolean> {
        const fullPath = `${poolName}/${datasetName}`;
        try {
            await execa('zfs', ['list', '-H', '-o', 'name', fullPath]);
            return true;
        } catch {
            return false;
        }
    }

    async getDatasetInfo(
        poolName: string,
        datasetName: string
    ): Promise<{
        datasetSize?: number;
        availableSpace?: number;
        mountpoint?: string;
    }> {
        const fullPath = `${poolName}/${datasetName}`;
        const result: { datasetSize?: number; availableSpace?: number; mountpoint?: string } = {};

        try {
            // Get dataset size
            const { stdout: sizeOutput } = await execa('zfs', [
                'list',
                '-H',
                '-p',
                '-o',
                'used',
                fullPath,
            ]);
            const size = parseInt(sizeOutput.trim(), 10);
            if (!isNaN(size)) {
                result.datasetSize = size;
            }
        } catch (error: unknown) {
            this.logger.warn(
                `Failed to get dataset size: ${error instanceof Error ? error.message : String(error)}`
            );
        }

        try {
            // Get available space
            const { stdout: availOutput } = await execa('zfs', [
                'list',
                '-H',
                '-p',
                '-o',
                'avail',
                fullPath,
            ]);
            const avail = parseInt(availOutput.trim(), 10);
            if (!isNaN(avail)) {
                result.availableSpace = avail;
            }
        } catch (error: unknown) {
            this.logger.warn(
                `Failed to get available space: ${error instanceof Error ? error.message : String(error)}`
            );
        }

        try {
            // Get mountpoint
            const { stdout: mountOutput } = await execa('zfs', [
                'list',
                '-H',
                '-o',
                'mountpoint',
                fullPath,
            ]);
            result.mountpoint = mountOutput.trim();
        } catch (error: unknown) {
            this.logger.warn(
                `Failed to get mountpoint: ${error instanceof Error ? error.message : String(error)}`
            );
        }

        return result;
    }

    async getExistingSnapshots(
        poolName: string,
        datasetName: string,
        prefix?: string
    ): Promise<string[]> {
        const fullPath = `${poolName}/${datasetName}`;

        try {
            const { stdout } = await execa('zfs', [
                'list',
                '-H',
                '-t',
                'snapshot',
                '-o',
                'name',
                '-r',
                fullPath,
            ]);
            const snapshots = stdout.split('\n').filter((line) => line.trim());

            if (prefix) {
                const prefixPattern = `${fullPath}@${prefix}`;
                return snapshots.filter((snapshot) => snapshot.startsWith(prefixPattern));
            }

            return snapshots.filter((snapshot) => snapshot.startsWith(`${fullPath}@`));
        } catch {
            return [];
        }
    }

    async getPoolHealth(poolName: string): Promise<string | null> {
        try {
            const { stdout } = await execa('zpool', ['list', '-H', '-o', 'health', poolName]);
            return stdout.trim();
        } catch {
            return null;
        }
    }

    async canCreateSnapshot(poolName: string, datasetName: string): Promise<boolean> {
        // Check if we have write permissions and the dataset is not readonly
        const fullPath = `${poolName}/${datasetName}`;

        try {
            const { stdout } = await execa('zfs', ['get', '-H', '-o', 'value', 'readonly', fullPath]);
            return stdout.trim() === 'off';
        } catch {
            return false;
        }
    }
}
