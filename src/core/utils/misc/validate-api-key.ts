import got from 'got';
import { varState } from '@app/core/states/var';
import { AppError } from '@app/core/errors/app-error';
import { logger } from '@app/core/log';

const validKeys = new Set();

export const clearValidKeyCache = () => {
	validKeys.clear();
	logger.debug('Cleared all keys from validity cache');
};

export const sendFormToKeyServer = async (url: string, data: Record<string, unknown>) => {
	if (!data) {
		throw new AppError('Missing data field.');
	}

	// Create form
	const form = new URLSearchParams();
	Object.entries(data).forEach(([key, value]) => {
		if (value !== undefined) {
			form.append(key, String(value));
		}
	});

	// Convert form to string
	const body = form.toString();
	logger.addContext('form', body);
	logger.trace('Sending form to key-server');
	logger.removeContext('form');

	// Send form
	return got(url, {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded'
		},
		timeout: {
			request: 5_000
		},
		body
	});
};

export const validateApiKey = async (apiKey: string, shouldThrow = true) => {
	// If we have the validity cached then return that
	if (validKeys.has(apiKey)) return true;

	const KEY_SERVER_KEY_VERIFICATION_ENDPOINT = process.env.KEY_SERVER_KEY_VERIFICATION_ENDPOINT ?? 'https://keys.lime-technology.com/validate/apikey';

	logger.addContext('apiKey', apiKey);
	logger.trace('Checking key-server validation for API key');
	logger.removeContext('apiKey');

	// Check if API key exists
	if (!apiKey) {
		if (shouldThrow) throw new Error('Missing API key');
		return false;
	}

	// Send apiKey, etc. to key-server for verification
	const response = await sendFormToKeyServer(KEY_SERVER_KEY_VERIFICATION_ENDPOINT, {
		guid: varState.data.flashGuid,
		apikey: apiKey
	});

	logger.addContext('apiKey', apiKey);
	logger.trace('Got response back from key-server while validating API key');
	logger.removeContext('apiKey');

	// Get response data
	const data = JSON.parse(response.body) as { valid: boolean };

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
	const valid = data.valid;
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
	if (shouldThrow) throw new Error('Invalid API key');
	return false;
};
