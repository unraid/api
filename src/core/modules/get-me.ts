/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '../types';
import { getPermissions } from '../utils';

/**
 * Get current user.
 */
export const getMe = (context: CoreContext): CoreResult => {
	const { user } = context;

	const me = {
		...user,
		permissions: getPermissions(user.role)
	};

	return {
		text: `Me: ${JSON.stringify(me, null, 2)}`,
		json: me
	};
};
