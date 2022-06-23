/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { CoreResult, CoreContext } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { getMachineId as getMachineIdFromFile } from '@app/core/utils/misc/get-machine-id';

/**
 * Get the machine ID.
 */
export const getMachineId = async function (context: CoreContext): Promise<CoreResult> {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'machine-id',
		action: 'read',
		possession: 'any'
	});

	const machineId = getMachineIdFromFile();

	return {
		text: `Machine ID: ${JSON.stringify(machineId, null, 2)}`,
		json: machineId
	};
};
