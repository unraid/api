import { logger } from '@app/core/log';
import { logoutUser } from '@app/store/modules/config';
import { store, getters } from '@app/store';
import { sendFormToKeyServer } from '@app/core/utils/misc/send-form-to-keyserver';

const validKeys = new Set();

export const clearValidKeyCache = () => {
	validKeys.clear();
	logger.debug('Cleared all keys from validity cache');
};

export const validateApiKey = async (apiKey: string, shouldThrow = true) => {
	// If we have the validity cached then return that
	if (validKeys.has(apiKey)) return true;

	const KEY_SERVER_KEY_VERIFICATION_ENDPOINT = process.env.KEY_SERVER_KEY_VERIFICATION_ENDPOINT ?? 'https://keys.lime-technology.com/validate/apikey';

	logger.addContext('apiKey', apiKey);
	logger.trace('Checking key-server validation for API key');
	logger.removeContext('apiKey');

	const emhttp = getters.emhttp();
	// Check if API key exists
	if (!apiKey || !emhttp.var.flashGuid) {
		if (shouldThrow) throw new Error('Missing API key or flashGuid');
		return false;
	}

	// Send apiKey, etc. to key-server for verification
	let response;
	try {
		response = await sendFormToKeyServer(KEY_SERVER_KEY_VERIFICATION_ENDPOINT, {
			guid: emhttp.var.flashGuid,
			apikey: apiKey,
		});
	} catch (error: unknown) {
		logger.addContext('networkError', error);
		logger.error('Caught error reaching Key Server');
		logger.removeContext('networkError');
		if (shouldThrow) {
			throw error;
		}

		return false;
	}

	logger.addContext('apiKey', apiKey);
	logger.trace('Got response back from key-server while validating API key');
	logger.removeContext('apiKey');

	// Get response data
	let data;
	try {
		data = JSON.parse(response.body) as { valid: boolean };
	} catch (error: unknown) {
		if (shouldThrow) {
			throw new Error('Could not parse JSON response from API Key Validation');
		}

		return false;
	}

	// Something went wrong
	if (response.statusCode !== 200) {
		const keyServerError = (data as unknown as { error: string }).error;
		if (shouldThrow) throw new Error('Error while validating API key with key-server' + (keyServerError ? ` "${keyServerError}"` : ''));
		return false;
	}

	logger.addContext('data', data);
	logger.trace('Response from key-server for API key validation');
	logger.removeContext('data');
	// Check if key is valid
	const { valid } = data;
	if (valid) {
		logger.trace('key-server marked API key as valid');
		validKeys.add(apiKey);
		logger.addContext('apiKey', apiKey);
		logger.debug('Added key to validity cache.');
		logger.removeContext('apiKey');
		return true;
	}

	// Throw or return if invalid
	logger.trace('key-server marked API key as invalid');
	await store.dispatch(logoutUser()).unwrap();
	if (shouldThrow) throw new Error('Invalid API key');
	return false;
};
