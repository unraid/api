/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '../../../types';
import { AppError, FieldMissingError } from '../../../errors';
import { emcmd, hasFields, ensurePermission } from '../../../utils';
import { usersState } from '../../../states';

interface Context extends CoreContext {
	params: {
		/** Name of user to delete. */
		name: string;
	};
}

/**
 * Delete user account.
 */
export const deleteUser = async (context: Context): Promise<CoreResult> => {
	// Check permissions
	ensurePermission(context.user, {
		resource: 'user',
		action: 'delete',
		possession: 'any'
	});

	const { params } = context;
	const { name } = params;
	const missingFields = hasFields(params, ['name']);

	if (missingFields.length !== 0) {
		// Just throw the first error
		throw new FieldMissingError(missingFields[0]);
	}

	// Check user exists
	if (!usersState.findOne({ name })) {
		throw new AppError('No user exists with this name.');
	}

	// Delete user
	await emcmd({
		userName: name,
		confirmDelete: 'on',
		cmdUserEdit: 'Delete'
	});

	return {
		text: 'User deleted successfully.'
	};
};
