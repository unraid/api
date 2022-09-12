/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '@app/core/types';
import { Var } from '@app/core/types/states';
import { varState } from '@app/core/states/var';
import { EmCmdError } from '@app/core/errors/em-cmd-error';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { emcmd } from '@app/core/utils/clients/emcmd';

interface Context extends CoreContext {
	data: Var;
}

interface Result extends CoreResult {
	json: {
		mdwriteMethod?: number;
		startArray?: boolean;
		spindownDelay?: number;
		defaultFormat?: any;
		defaultFsType?: any;
	};
}

/**
 * Update disk settings.
 */
export const updateDisk = async (context: Context): Promise<Result> => {
	const { data, user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'disk/settings',
		action: 'update',
		possession: 'any',
	});

	/**
	 * Check context.data[property] is using an allowed value.
	 *
	 * @param property The property of data to check values against.
	 * @param allowedValues Which values which are allowed.
	 * @param optional If the value can also be undefined.
	 */
	const check = (property: string, allowedValues: Record<string, string> | string[], optional = true): void => {
		const value = data[property];

		// Skip checking if the value isn't needed and it's not set
		if (optional && value === undefined) {
			return;
		}

		// AllowedValues is an object
		if (!Array.isArray(allowedValues)) {
			allowedValues = Object.keys(allowedValues);
		}

		if (!allowedValues.includes(value)) {
			throw new EmCmdError(property, value, allowedValues);
		}
	};

	// If set to 'Yes' then if the device configuration is correct upon server start - up, the array will be automatically started and shares exported.
	// If set to 'No' then you must start the array yourself.
	check('startArray', ['yes', 'no']);

	// Define the 'default' time-out for spinning hard drives down after a period of no I/O activity.
	// You may also override the default value for an individual disk.
	check('spindownDelay', {

		0: 'Never',
		15: '15 minutes',
		30: '30 minutes',
		45: '45 minutes',
		1: '1 hour',
		2: '2 hours',
		3: '3 hours',
		4: '4 hours',
		5: '5 hours',
		6: '6 hours',
		7: '7 hours',
		8: '8 hours',
		9: '9 hours',
		/* eslint-enable @typescript-eslint/naming-convention */
	});

	// Defines the type of partition layout to create when formatting hard drives 2TB in size and smaller **only**. (All devices larger then 2TB are always set up with GPT partition tables.)
	// **MBR: unaligned** setting will create MBR-style partition table, where the single partition 1 will start in the **63rd sector** from the start of the disk.  This is the *traditional* setting for virtually all MBR-style partition tables.
	// **MBR: 4K-aligned** setting will create an MBR-style partition table, where the single partition 1 will start in the **64th sector** from the start of the disk. Since the sector size is 512 bytes, this will *align* the start of partition 1 on a 4K-byte boundary.  This is required for proper support of so-called *Advanced Format* drives.
	// Unless you have a specific requirement do not change this setting from the default **MBR: 4K-aligned**.
	check('defaultFormat', {

		1: 'MBR: unaligned',
		2: 'MBR: 4K-aligned',
		/* eslint-enable @typescript-eslint/naming-convention */
	});

	// Selects the method to employ when writing to enabled disk in parity protected array.
	check('writeMethod', {
		auto: 'Auto - read/modify/write',

		0: 'read/modify/write',
		1: 'reconstruct write',
		/* eslint-enable @typescript-eslint/naming-convention */
	});

	// Defines the default file system type to create when an * unmountable * array device is formatted.
	// The default file system type for a single or multi - device cache is always Btrfs.
	check('defaultFsType', {
		xfs: 'xfs',
		btrfs: 'btrfs',
		reiserfs: 'reiserfs',

		'luks:xfs': 'xfs - encrypted',
		'luks:btrfs': 'btrfs - encrypted',
		'luks:reiserfs': 'reiserfs - encrypted',
		/* eslint-enable @typescript-eslint/naming-convention */
	});

	const {
		startArray,
		spindownDelay,
		defaultFormat,
		defaultFsType,
		mdWriteMethod,
	} = data;

	await emcmd({
		startArray,
		spindownDelay,
		defaultFormat,
		defaultFsType,

		md_write_method: mdWriteMethod,
		changeDisk: 'Apply',
	});

	// @todo: return all disk settings
	const result = {
		mdwriteMethod: varState?.data?.mdWriteMethod,
		startArray: varState?.data?.startArray,
		spindownDelay: varState?.data?.spindownDelay,
		defaultFormat: varState?.data?.defaultFormat,
		defaultFsType: varState?.data?.defaultFormat,
	};

	return {
		text: `Disk settings: ${JSON.stringify(result, null, 2)}`,
		json: result,
	};
};
