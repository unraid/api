/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '../types';
import { User } from '../types/states';
import { ensurePermission } from '../utils';
import { AppError } from '../errors';
import { usersState } from '../states';

interface Context extends CoreContext {
	query: {
		/** Should all fields be returned? */
		slim: string;
	};
}

/**
 * Get all users.
 */
export const getUsers = async (context: Context): Promise<CoreResult> => {
	const { query, user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'user',
		action: 'read',
		possession: 'any'
	});

	// Default to only showing limited fields
	const { slim = 'true' } = query;
	const users = usersState.find();

	if (users.length === 0) {
		// This is likely a new install or something went horribly wrong
		throw new AppError('No users found.', 404);
	}

	const result = slim === 'true' ? users.map((user: User) => {
		const { id, name, description, role } = user;
		return {
			id,
			name,
			description,
			role
		};
	}) : users;

	return {
		text: `Users: ${JSON.stringify(result, null, 2)}`,
		json: result
	};
};
