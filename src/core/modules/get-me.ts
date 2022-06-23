/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { CoreContext, CoreResult } from '@app/core/types';
import { getPermissions } from '@app/core/utils/permissions/get-permissions';

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
