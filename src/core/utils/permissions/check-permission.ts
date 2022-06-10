/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { User } from '../../types/states';
import { ParameterMissingError } from '../../errors';
import { ac } from '../../permissions';

export interface AccessControlOptions {
	/** Which resource to verify the user's role against. e.g. 'apikeys' */
	resource: string;
	/** Which action to verify the user's role against. e.g. 'read' */
	action: 'create' | 'read' | 'update' | 'delete';
	/**  If the user can access their own or everyone's. */
	possession: 'own' | 'any';
}

/**
 * Check if the user has the correct permissions.
 * @param user The user to check permissions on.
 */
export const checkPermission = (user: User, options: AccessControlOptions) => {
	if (!user) {
		throw new ParameterMissingError('user');
	}

	const { resource, action, possession = 'own' } = options;
	const permission = ac.permission({
		role: user.role,
		resource,
		action,
		possession
	});

	// Check if user is allowed
	return permission.granted;
};
