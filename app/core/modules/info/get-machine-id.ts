/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreResult, CoreContext } from '../../types';
import { ensurePermission, getMachineId as getMachineIdFromFile } from '../../utils';

/**
 * Get the machine ID.
 */
export const getMachineId = async function(context: CoreContext): Promise<CoreResult> {
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
