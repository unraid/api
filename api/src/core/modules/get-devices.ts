/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { CoreResult, CoreContext } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { getters } from '@app/store';

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
		possession: 'any',
	});

	const { devices } = getters.emhttp();

	return {
		text: `Devices: ${JSON.stringify(devices, null, 2)}`,
		json: devices,
	};
};
