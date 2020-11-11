/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { AppError } from '../errors';
import { CoreResult, CoreContext } from '../types';
import { ensurePermission } from '../utils';

/**
 * Get all unassigned devices.
 */
export const getUnassignedDevices = async(context: CoreContext): Promise<CoreResult> => {
	const { user } = context;

	// Bail if the user doesn't have permission
	ensurePermission(user, {
		resource: 'devices/unassigned',
		action: 'read',
		possession: 'any'
	});

	const devices = [];

	if (devices.length === 0) {
		throw new AppError('No devices found.', 404);
	}

	return {
		text: `Unassigned devices: ${JSON.stringify(devices, null, 2)}`,
		json: devices
	};
};
