/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { v4 as uuid } from 'uuid';
import uuidApiKey from 'uuid-apikey';
import type { CoreContext, CoreResult } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { apiManager, CacheItem } from '@app/core/api-manager';

interface Context extends CoreContext {
	data: {
		name?: string;
		key?: string;
		userId?: string;
		expiration?: string;
	};
}

interface Result extends CoreResult {
	json: CacheItem;
}

/**
 * Register an api key.
 *
 * NOTE: If the name or key is missing they'll be generated.
 */
export const addApikey = async (context: Context): Promise<Result | void> => {
	ensurePermission(context.user, {
		resource: 'apikey',
		action: 'create',
		possession: 'any'
	});

	const name = context.data?.name ?? uuid();
	const key = context.data?.key ?? uuidApiKey.create().apiKey;
	const userId = context.data?.userId ?? context.user.id;
	const expiration = context.data?.expiration;

	if (name && key) {
		apiManager.add(name, key, {
			userId,
			expiration
		});

		const result = apiManager.getKey(name);

		if (result) {
			return {
				json: result
			};
		}
	}
};

