/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { execa } from 'execa';
import {
    type Systeminformation,
    blockDevices,
    diskLayout,
} from 'systeminformation';
import { map as asyncMap } from 'p-iteration';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { type Context } from '@app/graphql/schema/utils';
import {
    type Disk,
    DiskInterfaceType,
    DiskSmartStatus,
} from '@app/graphql/generated/api/types';
import { DiskFsType } from '@app/graphql/generated/api/types';
import { graphqlLogger } from '@app/core/log';

const getTemperature = async (
    disk: Systeminformation.DiskLayoutData
): Promise<number> => {
    try {
        const stdout = await execa('smartctl', ['-A', disk.device])
            .then(({ stdout }) => stdout)
            .catch(() => '');
        const lines = stdout.split('\n');
        const header = lines.find((line) => line.startsWith('ID#')) ?? '';
        const fields = lines.splice(lines.indexOf(header) + 1, lines.length);
        const field = fields.find(
            (line) =>
                line.includes('Temperature_Celsius') ||
                line.includes('Airflow_Temperature_Cel')
        );

        if (!field) {
            return -1;
        }

        if (field.includes('Min/Max')) {
            return Number.parseInt(
                field.split('  -  ')[1].trim().split(' ')[0],
                10
            );
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
        .filter((partition) =>
            partition.name.startsWith(disk.device.split('/dev/')[1])
        )
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
export const getDisks = async (
    context: Context,
    options?: { temperature: boolean }
): Promise<Disk[]> => {
    const { user } = context;

    // Check permissions
    ensurePermission(user, {
        resource: 'disk',
        action: 'read',
        possession: 'any',
    });

    // Return all fields but temperature
    if (options?.temperature === false) {
        const partitions = await blockDevices().then((devices) =>
            devices.filter((device) => device.type === 'part')
        );
        const disks = await asyncMap(await diskLayout(), async (disk) =>
            parseDisk(disk, partitions)
        );

        return disks;
    }

    const partitions = await blockDevices().then((devices) =>
        devices.filter((device) => device.type === 'part')
    );
    const disks = await asyncMap(await diskLayout(), async (disk) =>
        parseDisk(disk, partitions, true)
    );

    return disks;
};
