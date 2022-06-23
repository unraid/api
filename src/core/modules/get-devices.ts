/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { CoreResult, CoreContext } from '@app/core/types';
import { devicesState } from '@app/core/states/devices';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';

/**
 * Get all devices.
 * @returns All currently connected devices.
 */
export const getDevices = async (context: CoreContext): Promise<CoreResult> => {
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
