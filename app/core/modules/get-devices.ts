/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreResult, CoreContext } from '../types';
import { devicesState } from '../states';
import { ensurePermission } from '../utils';

/**
 * Get all devices.
 * @returns All currently connected devices.
 */
export const getDevices = async(context: CoreContext): Promise<CoreResult> => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'device',
		action: 'read',
		possession: 'any'
	});

	const devices = devicesState.find();

	return {
		text: `Devices: ${JSON.stringify(devices, null, 2)}`,
		json: devices
	};
};
