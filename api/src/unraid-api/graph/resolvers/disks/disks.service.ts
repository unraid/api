import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Systeminformation } from 'systeminformation';
import { execa } from 'execa';
import { blockDevices, diskLayout } from 'systeminformation';
import { z } from 'zod';

import { ArrayDisk } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import {
    Disk,
    DiskFsType,
    DiskInterfaceType,
    DiskSmartStatus,
} from '@app/unraid-api/graph/resolvers/disks/disks.model.js';
import { batchProcess } from '@app/utils.js';

const SmartAttributeSchema = z.object({
    id: z.number(),
    raw: z
        .object({
            value: z.number(),
        })
        .optional()
        .nullable(),
});

type SmartAttribute = z.infer<typeof SmartAttributeSchema>;

const SmartDataSchema = z.object({
    temperature: z
        .object({
            current: z.number().optional().nullable(),
        })
        .optional()
        .nullable(),
    ata_smart_attributes: z
        .object({
            table: z.array(SmartAttributeSchema).optional().nullable(),
        })
        .optional()
        .nullable(),
});
interface EmhttpDevice {
    id?: string;
    device?: string;
}

interface EmhttpDeviceRecord {
    id?: unknown;
    device?: unknown;
}

const normalizeDeviceName = (value: string | undefined): string => {
    if (!value) {
        return '';
    }
    return value.startsWith('/dev/') ? value.slice('/dev/'.length) : value;
};

@Injectable()
export class DisksService {
    constructor(private readonly configService: ConfigService) {}

    private getEmhttpDevices(): EmhttpDevice[] {
        const rawDevicesValue = this.configService.get<unknown>('store.emhttp.devices', []);
        const rawDevices = Array.isArray(rawDevicesValue) ? rawDevicesValue : [];
        const emhttpDevices: EmhttpDevice[] = [];

        for (const raw of rawDevices) {
            if (!raw || typeof raw !== 'object') {
                continue;
            }

            const record = raw as EmhttpDeviceRecord;
            const id = typeof record.id === 'string' ? record.id.trim() : '';
            const device = typeof record.device === 'string' ? record.device.trim() : '';

            if (!id || !device) {
                continue;
            }

            emhttpDevices.push({
                id,
                device: normalizeDeviceName(device),
            });
        }

        return emhttpDevices;
    }

    private findEmhttpDevice(
        disk: Systeminformation.DiskLayoutData,
        emhttpDevices: EmhttpDevice[]
    ): EmhttpDevice | undefined {
        const normalizedSystemDevice = normalizeDeviceName(disk.device);
        if (!normalizedSystemDevice) {
            return undefined;
        }

        return emhttpDevices.find((emhttpDevice) => emhttpDevice.device === normalizedSystemDevice);
    }

    public async getTemperature(device: string): Promise<number | null> {
        try {
            const { stdout } = await execa('smartctl', ['-n', 'standby', '-A', '-j', device]);
            const parsedData = SmartDataSchema.safeParse(JSON.parse(stdout));

            if (!parsedData.success) {
                return null;
            }
            const data = parsedData.data;

            if (data.temperature?.current !== undefined && data.temperature?.current !== null) {
                return data.temperature.current;
            }

            if (data.ata_smart_attributes?.table) {
                const tempAttr = data.ata_smart_attributes.table.find(
                    // Attribute 194: This is the standard SMART attribute ID
                    // for "Temperature_Celsius" on most hard drives and SSDs
                    //
                    // Attribute 190: This is an alternative temperature
                    // attribute ID used by some drive manufacturers (often
                    // called "Airflow_Temperature_Celsius" or just another
                    // temperature reading)
                    (a: SmartAttribute) => a.id === 194 || a.id === 190
                );
                if (tempAttr?.raw?.value !== undefined && tempAttr?.raw?.value !== null) {
                    return tempAttr.raw.value;
                }
            }

            return null;
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
        arrayDisks: ArrayDisk[],
        emhttpDevices: EmhttpDevice[]
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
        const emhttpDevice = this.findEmhttpDevice(disk, emhttpDevices);

        return {
            ...disk,
            id: disk.serialNum, // Ensure id is set
            emhttpDeviceId: emhttpDevice?.id,
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
        const emhttpDevices = this.getEmhttpDevices();
        const { data } = await batchProcess(await diskLayout(), async (disk) =>
            this.parseDisk(disk, partitions, arrayDisks, emhttpDevices)
        );
        return data;
    }
}
