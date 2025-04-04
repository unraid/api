import { Injectable } from '@nestjs/common';

import type { Systeminformation } from 'systeminformation';
import { execa } from 'execa';
import { blockDevices, diskLayout } from 'systeminformation';

import type { Disk } from '@app/graphql/generated/api/types.js';
import { graphqlLogger } from '@app/core/log.js';
import { DiskFsType, DiskInterfaceType, DiskSmartStatus } from '@app/graphql/generated/api/types.js';
import { getters } from '@app/store/index.js';
import { batchProcess } from '@app/utils.js';

@Injectable()
export class DisksService {
    // Renamed from DiskService
    private async getTemperature(disk: Systeminformation.DiskLayoutData): Promise<number> {
        try {
            const stdout = await execa('smartctl', ['-A', disk.device])
                .then(({ stdout }) => stdout)
                .catch(() => '');
            const lines = stdout.split('\n');
            const header = lines.find((line) => line.startsWith('ID#')) ?? '';
            const fields = lines.splice(lines.indexOf(header) + 1, lines.length);
            const field = fields.find(
                (line) =>
                    line.includes('Temperature_Celsius') || line.includes('Airflow_Temperature_Cel')
            );

            if (!field) {
                return -1;
            }

            if (field.includes('Min/Max')) {
                return Number.parseInt(field.split('  -  ')[1].trim().split(' ')[0], 10);
            }

            const line = field.split(' ');
            return Number.parseInt(line[line.length - 1], 10);
        } catch (error) {
            graphqlLogger.warn('Caught error fetching disk temperature: %o', error);
            return -1;
        }
    }

    private async parseDisk(
        disk: Systeminformation.DiskLayoutData,
        partitionsToParse: Systeminformation.BlockDevicesData[],
        temperature = false
    ): Promise<Disk> {
        const partitions = partitionsToParse
            // Only get partitions from this disk
            .filter((partition) => partition.name.startsWith(disk.device.split('/dev/')[1]))
            // Remove unneeded fields
            .map(({ name, fsType, size }) => {
                let mappedFsType: DiskFsType | undefined;
                // Explicitly map known fsTypes to the enum (UPPERCASE)
                switch (fsType?.toLowerCase()) {
                    case 'xfs':
                        mappedFsType = DiskFsType.XFS; // Uppercase
                        break;
                    case 'btrfs':
                        mappedFsType = DiskFsType.BTRFS; // Uppercase
                        break;
                    case 'vfat':
                        mappedFsType = DiskFsType.VFAT; // Uppercase
                        break;
                    case 'zfs':
                        mappedFsType = DiskFsType.ZFS; // Uppercase
                        break;
                    case 'ext4':
                        mappedFsType = DiskFsType.EXT4; // Uppercase
                        break;
                    case 'ntfs':
                        mappedFsType = DiskFsType.NTFS; // Uppercase
                        break;
                    default:
                        mappedFsType = undefined; // Handle unknown types as undefined
                }
                return {
                    name,
                    fsType: mappedFsType,
                    size,
                };
            })
            // Filter out partitions where fsType mapping failed
            .filter(
                (p): p is { name: string; fsType: DiskFsType; size: number } => p.fsType !== undefined
            );

        // Explicitly map interface types
        let mappedInterfaceType: DiskInterfaceType;
        switch (disk.interfaceType?.toUpperCase()) {
            case 'SATA':
                mappedInterfaceType = DiskInterfaceType.SATA;
                break;
            case 'SAS':
                mappedInterfaceType = DiskInterfaceType.SAS;
                break;
            case 'USB':
                mappedInterfaceType = DiskInterfaceType.USB;
                break;
            case 'NVME': // Map NVMe string to PCIE enum
                mappedInterfaceType = DiskInterfaceType.PCIE;
                break;
            case 'PCIE': // Also handle PCIE string
                mappedInterfaceType = DiskInterfaceType.PCIE;
                break;
            default:
                mappedInterfaceType = DiskInterfaceType.UNKNOWN;
        }

        return {
            ...disk,
            id: disk.serialNum, // Ensure id is set
            smartStatus:
                typeof disk.smartStatus === 'string'
                    ? (DiskSmartStatus[disk.smartStatus.toUpperCase() as keyof typeof DiskSmartStatus] ??
                      DiskSmartStatus.UNKNOWN)
                    : DiskSmartStatus.UNKNOWN, // Default to UNKNOWN if undefined
            interfaceType: mappedInterfaceType,
            temperature: temperature ? await this.getTemperature(disk) : -1,
            partitions, // Now correctly typed after filter
        };
    }

    /**
     * Get all disks.
     */
    async getDisks(options?: { temperature: boolean }): Promise<Disk[]> {
        const vars = getters.emhttp().var;

        // Return all fields but temperature
        if (options?.temperature === false) {
            const partitions = await blockDevices().then((devices) =>
                devices.filter((device) => device.type === 'part')
            );
            const diskLayoutData = await diskLayout();
            // Pass unraidVar to parseDisk
            const disks = await Promise.all(
                diskLayoutData.map((disk) => this.parseDisk(disk, partitions))
            );

            return disks;
        }

        const partitions = await blockDevices().then((devices) =>
            devices.filter((device) => device.type === 'part')
        );

        const { data } = await batchProcess(await diskLayout(), async (disk) =>
            // Pass unraidVar and temperature flag to parseDisk
            this.parseDisk(disk, partitions, true)
        );
        return data;
    }
}
