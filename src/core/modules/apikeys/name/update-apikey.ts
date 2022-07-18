/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { PermissionError } from '@app/core/errors/permission-error';
import { CoreResult, CoreContext } from '@app/core/types';
import getApikey from '@app/core/modules/apikeys/name/get-apikey';

interface Context extends CoreContext {
	data: {
		password: string;
	};
	params: {
		name: string;
	};
}

/**
 * Update an apiKey.
 *
 * @returns The apikey, when the key expires and the scopes the key can use.
 */
export const updateApiKey = async (context: Context): Promise<CoreResult> => {
	// Since we pass the context we don't need to worry about checking if the user has permissions
	const key = await getApikey(context).then(result => result.json);

	if (!key) {
		throw new PermissionError('Access denied!');
	}

	return {
		json: {
			...key,
		},
	};
};
