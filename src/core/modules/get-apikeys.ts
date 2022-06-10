/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { apiManager } from '../api-manager';
import { checkPermission } from '../utils';
import { CoreResult, CoreContext } from '../types';

/**
 * Get all apikeys
 *
 * @returns All apikeys with their respective `name`, `key` and `expiresAt`.
 */
export const getApikeys = async function (context: CoreContext): Promise<CoreResult> {
	const { user } = context;
	const canReadAny = checkPermission(user, {
		resource: 'apikey',
		action: 'read',
		possession: 'any'
	});

	const validKeys = apiManager.getValidKeys();
	const keys = canReadAny ? validKeys : validKeys.filter(key => key.name === `user:${user.name}`);

	return {
		text: `ApiKeys: ${JSON.stringify(keys, null, 2)}`,
		json: keys
	};
};

export default getApikeys;
