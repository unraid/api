/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '../../../types';
import { AppError, FieldMissingError } from '../../../errors';
import { ensurePermission, hasFields } from '../../../utils';
import { usersState } from '../../../states';

interface Context extends CoreContext {
	params: {
		/** Name of user to add the role to. */
		name: string;
	};
}

/**
 * Add role to user.
 */
export const addRole = async(context: Context): Promise<CoreResult> => {
	const { user, params } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'user',
		action: 'update',
		possession: 'any'
	});

	// Validation
	const { name } = params;
	const missingFields = hasFields(params, ['name']);

	if (missingFields.length !== 0) {
		throw new FieldMissingError(missingFields[0]);
	}

	// Check user exists
	if (!usersState.findOne({ name })) {
		throw new AppError('No user exists with this name.');
	}

	// @todo: add user role

	return {
		text: 'User updated successfully.'
	};
};
