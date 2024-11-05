import type { CoreContext, CoreResult } from '@app/core/types';
import { AppError } from '@app/core/errors/app-error';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { hasFields } from '@app/core/utils/validation/has-fields';
import { FieldMissingError } from '@app/core/errors/field-missing-error';
import { emcmd } from '@app/core/utils/clients/emcmd';
import { getters } from '@app/store';
import { pubsub } from '@app/core/pubsub';

interface Context extends CoreContext {
	readonly data: {
		/** Display name. */
		readonly name: string;
		/** User's password. */
		readonly password: string;
		/** Friendly description. */
		readonly description: string;
	};
}

/**
 * Add user account.
 */
export const addUser = async (context: Context): Promise<CoreResult> => {
	const { data } = context;
	// Check permissions
	ensurePermission(context.user, {
		resource: 'user',
		action: 'create',
		possession: 'any',
	});

	// Validation
	const { name, description = '', password } = data;
	const missingFields = hasFields(data, ['name', 'password']);

	if (missingFields.length !== 0) {
		// Only log first error.
		throw new FieldMissingError(missingFields[0]);
	}

	// Check user name isn't taken
	if (getters.emhttp().users.find(user => user.name === name)) {
		throw new AppError('A user account with that name already exists.');
	}

	// Create user
	await emcmd({
		userName: name,
		userDesc: description,
		userPassword: password,
		userPasswordConf: password,
		cmdUserEdit: 'Add',
	});

	// Get fresh copy of Users with the new user
	const user = getters.emhttp().users.find(user => user.name === name);
	if (!user) {
		// User managed to disappear between us creating it and the lookup?
		throw new AppError('Internal Server Error!');
	}

	// Update users channel with new user
	pubsub.publish('users', {
		users: {
			mutation: 'CREATED',
			node: [user],
		},
	});

	// Update user channel with new user
	pubsub.publish('user', {
		user: {
			mutation: 'CREATED',
			node: user,
		},
	});

	return {
		text: `User created successfully. ${JSON.stringify(user, null, 2)}`,
		json: user,
	};
};
