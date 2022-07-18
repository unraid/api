import { MOTHERSHIP_RELAY_WS_LINK } from '@app/consts';
import { logger } from '@app/core';
import got, { HTTPError, TimeoutError } from 'got';

const createGotOptions = (apiVersion: string, apiKey: string) => ({
	timeout: {
		request: 5_000,
	},
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
		'x-unraid-api-version': apiVersion,
		'x-api-key': apiKey,
	},
});

// Check if we're rate limited, etc.
export const checkMothershipAuthentication = async (apiVersion: string, apiKey: string) => {
	const url = MOTHERSHIP_RELAY_WS_LINK.replace('ws', 'http');

	try {
		const options = createGotOptions(apiVersion, apiKey);

		// This will throw if there is a non 2XX/3XX code
		await got.head(url, options);
	} catch (error: unknown) {
		// HTTP errors
		if (error instanceof HTTPError) {
			switch (error.response.statusCode) {
				case 429: {
					const retryAfter = error.response.headers['retry-after'];
					throw new Error(retryAfter ? `${url} is rate limited for another ${retryAfter} seconds` : `${url} is rate limited`);
				}

				case 401:
					throw new Error('Invalid credentials');
				default:
					throw new Error(`Failed to connect to ${url} with a "${error.response.statusCode}" HTTP error.`);
			}
		}

		// Timeout error
		if (error instanceof TimeoutError) throw new Error(`Timed-out while connecting to "${url}"`);

		// Unknown error
		logger.trace('Unknown Error', error);
		// @TODO: Add in the cause when we move to a newer node version
		// throw new Error('Unknown Error', { cause: error as Error });
		throw new Error('Unknown Error');
	}
};
