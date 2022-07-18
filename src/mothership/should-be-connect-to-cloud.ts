import { apiManager } from '@app/core/api-manager';
import { validateApiKey } from '@app/core/utils/misc/validate-api-key';
import { validateApiKeyFormat } from '@app/core/utils/misc/validate-api-key-format';
import { logger } from '@app/core/log';

export const wsState = {
	outOfDate: false,
};

// Ensure we should actually be connected right now
// If our API key exists and is the right length then we should always try to connect
export const shouldBeConnectedToCloud = async () => {
	try {
		if (wsState.outOfDate) return false;

		const apiKey = apiManager.cloudKey;

		if (!apiKey) {
			logger.trace('My servers API key is missing');
			return false;
		}

		// Key format must be valid
		validateApiKeyFormat(apiKey);

		// Key must pass key-server validation
		await validateApiKey(apiKey);

		return true;
	} catch (error: unknown) {
		if (!(error instanceof Error)) throw new Error(`Unknown Error "${error as string}"`);
		logger.trace(error.message);
		return false;
	}
};
