/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import execa from 'execa';
import { Systeminformation, blockDevices, diskLayout } from 'systeminformation';
import { map as asyncMap } from 'p-iteration';
import { CoreContext, CoreResult } from '../types';
import { uppercaseFirstChar, ensurePermission } from '../utils';

interface Partition {
	name: string;
	fsType: string;
	size: number;
}

export interface Disk extends Systeminformation.DiskLayoutData {
	smartStatus: string;
	interfaceType: string;
	temperature: number;
	partitions: Partition[];
}

const getTemperature = async (disk: Systeminformation.DiskLayoutData): Promise<number> => {
	const stdout = await execa('smartctl', ['-A', disk.device]).then(({ stdout }) => stdout).catch(() => '');
	const lines = stdout.split('\n');
	const header = lines.find(line => line.startsWith('ID#'))!;
	const fields = lines.splice(lines.indexOf(header) + 1, lines.length);
	const field = fields.find(line => {
		return line.includes('Temperature_Celsius') || line.includes('Airflow_Temperature_Cel');
	});

	if (!field) {
		return -1;
	}

	if (field.includes('Min/Max')) {
		return Number.parseInt(field.split('  -  ')[1].trim().split(' ')[0], 10);
	}

	const line = field.split(' ');
	return Number.parseInt(line[line.length - 1], 10);
};

const parseDisk = async (disk: Systeminformation.DiskLayoutData, partitionsToParse: Systeminformation.BlockDevicesData[], temperature = false): Promise<Disk> => {
	const partitions = partitionsToParse
		// Only get partitions from this disk
		.filter(partition => partition.name.startsWith(disk.device.split('/dev/')[1]))
		// Remove unneeded fields
		.map(({ name, fstype, size }) => ({
			name,
			fsType: fstype,
			size
		}));

	return {
		...disk,
		smartStatus: uppercaseFirstChar(disk.smartStatus.toLowerCase()),
		interfaceType: disk.interfaceType || 'UNKNOWN',
		temperature: temperature ? await getTemperature(disk) : -1,
		partitions
	};
};

interface Result extends CoreResult {
	json: Disk[];
}

/**
 * Get all disks.
 */
export const getDisks = async (context: CoreContext, options?: { temperature: boolean }): Promise<Result> => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'disk',
		action: 'read',
		possession: 'any'
	});

	// Return all fields but temperature
	if (options?.temperature === false) {
		const partitions = await blockDevices().then(devices => devices.filter(device => device.type === 'part'));
		const disks = await asyncMap(await diskLayout(), async disk => parseDisk(disk, partitions));

		return {
			text: `Disks: ${JSON.stringify(disks, null, 2)}`,
			json: disks
		};
	}

	const partitions = await blockDevices().then(devices => devices.filter(device => device.type === 'part'));
	const disks = await asyncMap(await diskLayout(), async disk => parseDisk(disk, partitions, true));

	return {
		text: `Disks: ${JSON.stringify(disks, null, 2)}`,
		json: disks
	};
};
