import { logger } from '../core';
import { apiManager } from '../core/api-manager';
import { validateApiKey } from '../core/utils/misc/validate-api-key';
import { validateApiKeyFormat } from '../core/utils/misc/validate-api-key-format';

// Ensure API key exists and is valid
const checkApiKey = async () => {
	const apiKey = apiManager.getKey('my_servers')?.key;

	// Key format must be valid
	if (!validateApiKeyFormat(apiKey, false)) {
		logger.trace('My servers API key is not in a valid format');
		return false;
	}

	// Key must pass key-server validation
	if (!(await validateApiKey(apiKey!, false))) {
		logger.trace('My servers API key failed key-server validation');
		return false;
	}

	return true;
};

export const wsState = {
	outOfDate: false
};

// Ensure we should actually be connected right now
// If our API key exists and is the right length then we should always try to connect
export const shouldBeConnectedToCloud = async () => {
	logger.trace('Checking if we should be connected to the cloud');
	if (wsState.outOfDate) return false;
	const shouldBeConnected = await checkApiKey();
	if (shouldBeConnected) logger.trace('We should be connected');
	else logger.trace('We should be disconnected');
	return shouldBeConnected;
};
