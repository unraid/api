import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Systeminformation } from 'systeminformation';
import { execa } from 'execa';
import { blockDevices, diskLayout } from 'systeminformation';

import { ArrayDisk } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import {
    Disk,
    DiskFsType,
    DiskInterfaceType,
    DiskSmartStatus,
} from '@app/unraid-api/graph/resolvers/disks/disks.model.js';
import { batchProcess } from '@app/utils.js';

@Injectable()
export class DisksService {
    constructor(private readonly configService: ConfigService) {}
    public async getTemperature(device: string): Promise<number | null> {
        try {
            const { stdout } = await execa('smartctl', ['-A', device]);
            const lines = stdout.split('\n');
            const header = lines.find((line) => line.startsWith('ID#')) ?? '';
            const fields = lines.splice(lines.indexOf(header) + 1, lines.length);
            const field = fields.find(
                (line) =>
                    line.includes('Temperature_Celsius') || line.includes('Airflow_Temperature_Cel')
            );

            if (!field) {
                return null;
            }

            if (field.includes('Min/Max')) {
                return Number.parseInt(field.split('  -  ')[1].trim().split(' ')[0], 10);
            }

            const line = field.split(' ');
            return Number.parseInt(line[line.length - 1], 10);
        } catch (error: unknown) {
            return null;
        }
    }

    public async getDisk(id: string): Promise<Disk> {
        const disks = await this.getDisks();
        const disk = disks.find((d) => d.id === id);
        if (!disk) {
            throw new NotFoundException(`Disk with id ${id} not found`);
        }
        return disk;
    }

    private async parseDisk(
        disk: Systeminformation.DiskLayoutData,
        partitionsToParse: Systeminformation.BlockDevicesData[],
        arrayDisks: ArrayDisk[]
    ): Promise<Omit<Disk, 'temperature'>> {
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

        const arrayDisk = arrayDisks.find((d) => d.id.trim() === disk.serialNum.trim());

        return {
            ...disk,
            id: disk.serialNum, // Ensure id is set
            smartStatus:
                DiskSmartStatus[disk.smartStatus?.toUpperCase() as keyof typeof DiskSmartStatus] ??
                DiskSmartStatus.UNKNOWN,
            interfaceType: mappedInterfaceType,
            partitions,
            isSpinning: arrayDisk?.isSpinning ?? false,
        };
    }

    /**
     * Get all disks.
     */
    async getDisks(): Promise<Disk[]> {
        const partitions = await blockDevices().then((devices) =>
            devices.filter((device) => device.type === 'part')
        );
        const arrayDisks = this.configService.get<ArrayDisk[]>('store.emhttp.disks', []);
        const { data } = await batchProcess(await diskLayout(), async (disk) =>
            this.parseDisk(disk, partitions, arrayDisks)
        );
        return data;
    }
}
