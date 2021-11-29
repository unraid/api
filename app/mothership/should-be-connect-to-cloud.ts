import { apiManager } from '../core/api-manager';
import { validateApiKey } from '../core/utils/misc/validate-api-key';
import { validateApiKeyFormat } from '../core/utils/misc/validate-api-key-format';

// Ensure API key exists and is valid
const checkApiKey = async () => {
	const apiKey = apiManager.getKey('my_servers')?.key;

	// Key format must be valid
	if (validateApiKeyFormat(apiKey, false)) return false;

	// Key must pass key-server validation
	if (await validateApiKey(apiKey!, false)) return false;

	return true;
};

// Ensure we should actually be connected right now
// If our API key exists and is the right length then we should always try to connect
export const shouldBeConnectedToCloud = async () => checkApiKey();
