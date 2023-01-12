/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { logger } from '@app/core/log';
import { getters } from '@app/store';
import { type ApiKeyResponse } from '@app/graphql/generated/api/types';
import { isApiKeyValid } from '@app/store/getters/index';

export const checkApi = async (): Promise<ApiKeyResponse> => {
	logger.trace('Cloud endpoint: Checking API');
	const valid = isApiKeyValid();
	const error = valid ? null : getters.apiKey().status;

	return { valid, error };
};
