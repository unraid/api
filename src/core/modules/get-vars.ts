/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { CoreContext, CoreResult } from '@app/core/types';
import { varState } from '@app/core/states/var';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';

/**
 * Get all system vars.
 */
export const getVars = async (context: CoreContext): Promise<CoreResult> => {
	const { user } = context;

	// Bail if the user doesn't have permission
	ensurePermission(user, {
		resource: 'vars',
		action: 'read',
		possession: 'any'
	});

	return {
		text: `Vars: ${JSON.stringify(varState.data, null, 2)}`,
		json: {
			...varState.data
		}
	};
};
