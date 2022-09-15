/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { logger } from '@app/core/log';
import { validateApiKey } from '@app/core/utils/misc/validate-api-key';
import { validateApiKeyFormat } from '@app/core/utils/misc/validate-api-key-format';
import { Cloud } from '@app/graphql/resolvers/query/cloud/create-response';
import { getters } from '@app/store';

export const checkApi = async (): Promise<Cloud['apiKey']> => {
	logger.trace('Cloud endpoint: Checking API');
	try {
		// Check if we have an API key loaded for my servers
		const apiKey = getters.config().remote.apikey;
		if (!apiKey) throw new Error('API key is missing');

		// Key format must be valid
		validateApiKeyFormat(apiKey);

		// Key must pass key-server validation
		await validateApiKey(apiKey);
		return { valid: true, error: null };
	} catch (error: unknown) {
		if (!(error instanceof Error)) throw new Error(`Unknown Error "${error as string}"`);
		return {
			valid: false,
			error: error.message,
		};
	} finally {
		logger.trace('Cloud endpoint: Done API');
	}
};
