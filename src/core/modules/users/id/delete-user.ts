/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { CoreContext, CoreResult } from '@app/core/types';
import { AppError } from '@app/core/errors/app-error';
import { FieldMissingError } from '@app/core/errors/field-missing-error';
import { usersState } from '@app/core/states/users';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { hasFields } from '@app/core/utils/validation/has-fields';
import { emcmd } from '@app/core/utils/clients/emcmd';

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
