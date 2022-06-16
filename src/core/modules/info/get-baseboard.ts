/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import si from 'systeminformation';
import type { CoreContext, CoreResult } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';

export const getBaseboard = async (context: CoreContext): Promise<CoreResult> => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'baseboard',
		action: 'read',
		possession: 'any'
	});

	// @TODO: Convert baseboard.model to known model name
	// 		  e.g. 084YMW -> R510
	const baseboard = await si.baseboard();

	return {
		json: {
			...baseboard
		}
	};
};
