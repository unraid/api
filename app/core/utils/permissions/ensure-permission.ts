/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { User } from '../.././types/states';
import { PermissionError } from '../../errors';
import { checkPermission, AccessControlOptions } from './check-permission';

/**
 * Ensure the user has the correct permissions.
 * @param user The user to check permissions on.
 * @param permissions A permissions object.
 */
export const ensurePermission = (user: User, options: AccessControlOptions) => {
	const { resource, action, possession = 'own' } = options;
	const permissionGranted = checkPermission(user, {
		resource,
		action,
		possession
	});

	// Bail if user doesn't have permission
	if (!permissionGranted) {
		throw new PermissionError(`${user.name} doesn't have permission to access "${resource}".`);
	}
};
