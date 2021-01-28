/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '../types';
import { varState } from '../states';
import { ensurePermission } from '../utils';

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
