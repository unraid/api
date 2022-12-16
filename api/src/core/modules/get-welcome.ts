/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { getUnraidVersion } from '@app/common/dashboard/get-unraid-version';
import type { CoreResult, CoreContext } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';

/**
 * Get welcome message.
 * @returns Welcomes a user.
 */
export const getWelcome = async (context: CoreContext): Promise<CoreResult> => {
	const { user } = context;

	// Bail if the user doesn't have permission
	ensurePermission(user, {
		resource: 'welcome',
		action: 'read',
		possession: 'any',
	});

	const version = await getUnraidVersion();
	const message = `Welcome ${user.name} to this Unraid ${version} server`;

	return {
		text: message,
		json: {
			message,
		},
	};
};
