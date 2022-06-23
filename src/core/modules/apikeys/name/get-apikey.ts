/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreResult, CoreContext } from '@app/core/types';
import { apiManager } from '@app/core/api-manager';
import { AppError } from '@app/core/errors/app-error';
import { ensurePermission } from '@app/core/utils';

interface Result extends CoreResult {
	json: {
		/** Display name. */
		name: string;
		/** The key. */
		key: string | number;
		/** When the key expires. */
		expiresAt: number;
		/** Which scopes this key is valid for. */
		scopes: any;
	};
}

interface Context extends CoreContext {
	data: {
		password: string;
	};
	params: {
		name: string;
	};
}

/**
 * Get an apiKey
 *
 * @memberof Core
 * @module apikeys/name/get-apikey
 * @param {Core~Context} context
 * @param {Object} context.params
 * @param {string} context.params.name
 * @returns {Core~Result} The API key, the user who owns the key, when the key expires and the scopes the key can use.
 */
export const getApikey = async (context: Context): Promise<Result> => {
	const { params, user } = context;
	const { name } = params;

	// Check permissions
	ensurePermission(user, {
		resource: 'apikey',
		action: 'read',
		possession: 'any'
	});

	// All valid API key names
	const apiKeys = apiManager.getValidKeys().map(item => item.name);

	// When the API key expires
	const expiresAt = apiManager.getValidKeys()
		// We have to use the name here otherwise it'd match the
		// first "owner" of the key and not the actual user
		.filter(item => item.name === name)
		.map(item => item.expiresAt)[0];

	// Check if API key is expired
	// @todo: Move this check to after the auth happens to prevent leaking when a key has expired to a non-authenticated or non-privileged user.
	if (expiresAt <= Date.now()) {
		throw new AppError('Key expired!');
	}

	// Check name is valid
	if (!apiKeys.includes(name)) {
		throw new AppError('Invalid name');
	}

	const scopes = [];
	const apiKey = apiManager.getKey(name)?.key;

	if (!apiKey) {
		throw new AppError('A key under this name hasn\'t been issued or it has expired.');
	}

	return {
		text: `ApiKey: ${apiKey}`,
		json: {
			name,
			key: apiKey,
			expiresAt: expiresAt || Date.now(),
			scopes
		}
	};
};

export default getApikey;
