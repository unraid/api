import type { Systeminformation } from 'systeminformation';
import { execa } from 'execa';
import { blockDevices, diskLayout } from 'systeminformation';

import type { Disk } from '@app/graphql/generated/api/types.js';
import { graphqlLogger } from '@app/core/log.js';
import { DiskFsType, DiskInterfaceType, DiskSmartStatus } from '@app/graphql/generated/api/types.js';
import { batchProcess } from '@app/utils.js';

const getTemperature = async (disk: Systeminformation.DiskLayoutData): Promise<number> => {
    try {
        const stdout = await execa('smartctl', ['-A', disk.device])
            .then(({ stdout }) => stdout)
            .catch(() => '');
        const lines = stdout.split('\n');
        const header = lines.find((line) => line.startsWith('ID#')) ?? '';
        const fields = lines.splice(lines.indexOf(header) + 1, lines.length);
        const field = fields.find(
            (line) => line.includes('Temperature_Celsius') || line.includes('Airflow_Temperature_Cel')
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
};

const parseDisk = async (
    disk: Systeminformation.DiskLayoutData,
    partitionsToParse: Systeminformation.BlockDevicesData[],
    temperature = false
): Promise<Disk> => {
    const partitions = partitionsToParse
        // Only get partitions from this disk
        .filter((partition) => partition.name.startsWith(disk.device.split('/dev/')[1]))
        // Remove unneeded fields
        .map(({ name, fsType, size }) => ({
            name,
            fsType: typeof fsType === 'string' ? DiskFsType[fsType] : undefined,
            size,
        }));

    return {
        ...disk,
        smartStatus:
            typeof disk.smartStatus === 'string'
                ? DiskSmartStatus[disk.smartStatus.toUpperCase()]
                : undefined,
        interfaceType:
            typeof disk.interfaceType === 'string'
                ? DiskInterfaceType[disk.interfaceType]
                : DiskInterfaceType.UNKNOWN,
        temperature: temperature ? await getTemperature(disk) : -1,
        partitions,
    };
};

/**
 * Get all disks.
 */
export const getDisks = async (options?: { temperature: boolean }): Promise<Disk[]> => {
    // Return all fields but temperature
    if (options?.temperature === false) {
        const partitions = await blockDevices().then((devices) =>
            devices.filter((device) => device.type === 'part')
        );
        const diskLayoutData = await diskLayout();
        const disks = await Promise.all(diskLayoutData.map((disk) => parseDisk(disk, partitions)));

        return disks;
    }

    const partitions = await blockDevices().then((devices) =>
        devices.filter((device) => device.type === 'part')
    );

    const { data } = await batchProcess(await diskLayout(), async (disk) =>
        parseDisk(disk, partitions, true)
    );
    return data;
};
