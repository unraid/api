/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import got, { HTTPError, OptionsOfTextResponseBody, TimeoutError } from 'got';
import { MOTHERSHIP_GRAPHQL_LINK, MOTHERSHIP_RELAY_WS_LINK } from '../../../consts';
import { apiManager } from '../../../core/api-manager';
import { validateApiKey } from '../../../core/utils/misc/validate-api-key';
import { validateApiKeyFormat } from '../../../core/utils/misc/validate-api-key-format';
import { ensurePermission } from '../../../core/utils/permissions/ensure-permission';
import { getRelayConnectionStatus, getRelayDisconnectionReason, getRelayReconnectingTimeout } from '../../../mothership/get-relay-connection-status';
import type { Context } from '../../schema/utils';
import { version } from '../../../../package.json';
import { logger } from '../../../core/log';
import { RelayStates } from '../../relay-state';
import { getAllowedOrigins } from '../../../common/allowed-origins';

const mothershipBaseUrl = MOTHERSHIP_GRAPHQL_LINK.replace('/graphql', '');

export type Cloud = {
	error?: string;
	apiKey: { valid: true; error: undefined } | { valid: false; error: string };
	relay: {
		status: RelayStates;
		timeout: undefined;
		error: undefined;
	} | {
		status: RelayStates;
		timeout: number | undefined;
		error: string;
	};
	mothership: { status: 'ok'; error: undefined } | { status: 'error'; error: string };
	allowedOrigins: string[];
};

const createResponse = (cloud: Cloud): Cloud => {
	return {
		...cloud,
		error: cloud.apiKey.error ?? cloud.relay.error ?? cloud.mothership.error
	};
};

const checkApi = async (): Promise<Cloud['apiKey']> => {
	logger.trace('Cloud endpoint: Checking API');
	try {
		// Check if we have an API key loaded for my servers
		const apiKey = apiManager.cloudKey;
		if (!apiKey) throw new Error('API key is missing');

		// Key format must be valid
		validateApiKeyFormat(apiKey);

		// Key must pass key-server validation
		await validateApiKey(apiKey);
		return { valid: true, error: undefined };
	} catch (error: unknown) {
		if (!(error instanceof Error)) throw new Error(`Unknown Error "${error as string}"`);
		return {
			valid: false,
			error: error.message
		};
	} finally {
		logger.trace('Cloud endpoint: Done API');
	}
};

const checkRelay = (): Cloud['relay'] => {
	logger.trace('Cloud endpoint: Checking relay');
	try {
		return {
			status: getRelayConnectionStatus().toLowerCase() as RelayStates,
			timeout: getRelayReconnectingTimeout(),
			error: getRelayDisconnectionReason() ?? ''
		};
	} finally {
		logger.trace('Cloud endpoint: Done relay');
	}
};

// Check if we're rate limited, etc.
const checkMothershipAuthentication = async (url: string, options: OptionsOfTextResponseBody) => {
	try {
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
		throw new Error('Unknown Error', { cause: error as Error });
	}
};

const checkMothership = async (): Promise<Cloud['mothership']> => {
	logger.trace('Cloud endpoint: Checking mothership');

	try {
		const apiVersion = version;
		const apiKey = apiManager.cloudKey;
		if (!apiKey) throw new Error('API key is missing');

		const timeout = { request: 2_000 };
		const headers = {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'x-unraid-api-version': apiVersion,
			'x-api-key': apiKey
		};
		const options = { timeout, headers };

		// Check if we can reach mothership
		// This is mainly testing the user's network config
		// If they cannot resolve this they may have it blocked or have a routing issue
		const mothershipCanBeResolved = await got.head(mothershipBaseUrl, options).then(() => true).catch(() => false);
		if (!mothershipCanBeResolved) return { status: 'error', error: `Failed resolving ${mothershipBaseUrl}` };

		// Check auth, rate limiting, etc.
		try {
			await checkMothershipAuthentication(MOTHERSHIP_RELAY_WS_LINK.replace('ws', 'http'), options);
		} catch (error: unknown) {
			if (!(error instanceof Error)) throw new Error(`Unknown Error "${error as string}"`);
			return { status: 'error', error: error.message };
		}

		return { status: 'ok', error: undefined };
	} finally {
		logger.trace('Cloud endpoint: Done mothership');
	}
};

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'cloud',
		action: 'read',
		possession: 'own'
	});

	// If the endpoint is mocked return the mocked data
	if (process.env.MOCK_CLOUD_ENDPOINT) {
		return {
			error: process.env.MOCK_CLOUD_ENDPOINT_ERROR,
			apiKey: {
				valid: Boolean(process.env.MOCK_CLOUD_ENDPOINT_APIKEY_VALID ?? true),
				error: process.env.MOCK_CLOUD_ENDPOINT_APIKEY_ERROR
			},
			relay: {
				status: process.env.MOCK_CLOUD_ENDPOINT_RELAY_STATUS as RelayStates ?? 'ok',
				timeout: process.env.MOCK_CLOUD_ENDPOINT_RELAY_TIMEOUT,
				reason: process.env.MOCK_CLOUD_ENDPOINT_RELAY_REASON,
				error: process.env.MOCK_CLOUD_ENDPOINT_RELAY_ERROR
			},
			mothership: {
				status: process.env.MOCK_CLOUD_ENDPOINT_MOTHERSHIP_STATUS as 'ok' | 'error' ?? 'ok',
				error: process.env.MOCK_CLOUD_ENDPOINT_MOTHERSHIP_ERROR
			},
			allowedOrigins: (process.env.MOCK_CLOUD_ENDPOINT_ALOWED_ORIGINS ?? '').split(',')
		};
	}

	const [apiKey, mothership] = await Promise.all([checkApi(), checkMothership()]);

	return createResponse({
		apiKey,
		relay: checkRelay(),
		mothership,
		allowedOrigins: getAllowedOrigins()
	});
};
