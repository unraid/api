import fetch from 'node-fetch';
import FormData from 'form-data';
import { varState } from '../../states';
import { AppError } from '../../errors';
import { logger } from '../..';

const validKeys = new Set();

export const clearValidKeyCache = () => {
	validKeys.clear();
	logger.debug('Cleared all keys from validity cache');
};

export const validateApiKey = async (apiKey: string, shouldThrow = true) => {
	// If we have the validity cached then return that
	if (validKeys.has(apiKey)) return true;

	const KEY_SERVER_KEY_VERIFICATION_ENDPOINT = process.env.KEY_SERVER_KEY_VERIFICATION_ENDPOINT ?? 'https://keys.lime-technology.com/validate/apikey';

	const sendFormToKeyServer = async (url: string, data: Record<string, unknown>) => {
		if (!data) {
			throw new AppError('Missing data field.');
		}

		// Create form
		const body = new FormData();
		Object.entries(data).forEach(([key, value]) => {
			if (value !== undefined) {
				body.append(key, String(value));
			}
		});

		// Send form
		return fetch(url, {
			method: 'POST',
			body
		});
	};

	// Send apiKey, etc. to key-server for verification
	const response = await sendFormToKeyServer(KEY_SERVER_KEY_VERIFICATION_ENDPOINT, {
		guid: varState.data.flashGuid,
		apikey: apiKey
	});

	logger.trace('Got response back from key-server while validating API key');

	// Something went wrong
	if (!response.ok) {
		if (shouldThrow) throw new Error('Error while validing API key with key-server.');
		return false;
	}

	// Check if key is valid
	const valid = await response.json().then(data => data.valid);
	if (valid) {
		validKeys.add(apiKey);
		logger.addContext('apiKey', apiKey);
		logger.debug('Added key to validity cache.');
		logger.removeContext('apiKey');
		return true;
	}

	// Throw or return if invalid
	if (shouldThrow) throw new Error('Invalid API key');
	return false;
};
