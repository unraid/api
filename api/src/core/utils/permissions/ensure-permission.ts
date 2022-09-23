/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { PermissionError } from '@app/core/errors/permission-error';
import { User } from '@app/core/types/states/user';
import { checkPermission, AccessControlOptions } from '@app/core/utils/permissions/check-permission';

/**
 * Ensure the user has the correct permissions.
 * @param user The user to check permissions on.
 * @param options A permissions object.
 */
export const ensurePermission = (user: User | undefined, options: AccessControlOptions) => {
	const { resource, action, possession = 'own' } = options;

	// Bail if no user was passed
	if (!user) throw new PermissionError(`No user provided for authentication check when trying to access "${resource}".`);

	const permissionGranted = checkPermission(user, {
		resource,
		action,
		possession,
	});

	// Bail if user doesn't have permission
	if (!permissionGranted) throw new PermissionError(`${user.name} doesn't have permission to access "${resource}".`);
};
