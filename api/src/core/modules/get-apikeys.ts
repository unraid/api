/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { apiManager } from '@app/core/api-manager';
import { checkPermission } from '@app/core/utils/permissions/check-permission';
import type { CoreResult, CoreContext } from '@app/core/types';

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
		possession: 'any',
	});

	const validKeys = apiManager.getValidKeys();
	const keys = canReadAny ? validKeys : validKeys.filter(key => key.name === `user:${user.name}`);

	return {
		text: `ApiKeys: ${JSON.stringify(keys, null, 2)}`,
		json: keys,
	};
};

export default getApikeys;
