/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreResult, CoreContext } from '../types';
import { ensurePermission } from '../utils';
import { getUnraidVersion } from '.';

/**
 * Get welcome message.
 * @returns Welcomes a user.
 */
export const getWelcome = async(context: CoreContext): Promise<CoreResult> => {
	const { user } = context;

	// Bail if the user doesn't have permission
	ensurePermission(user, {
		resource: 'welcome',
		action: 'read',
		possession: 'any'
	});

	const version = await getUnraidVersion(context).then(result => result.json.unraid);
	const message = `Welcome ${user.name} to this Unraid ${version} server`;

	return {
		text: message,
		json: {
			message
		}
	};
};
