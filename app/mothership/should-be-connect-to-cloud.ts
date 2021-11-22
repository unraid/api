import { apiManager } from '../core/api-manager';

// Ensure API key exists and is valid
const checkApiKey = async () => {
	const apiKey = apiManager.getKey('my_servers')?.key;
	if (!apiKey) {
		return false;
	}

	if (apiKey.length < 64) {
		return false;
	}

	return true;
};

// Ensure we should actually be connected right now
// If our API key exists and is the right length then we should always try to connect
export const shouldBeConnectedToCloud = async () => checkApiKey();
