/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { lookup as lookupDNS, resolve as resolveDNS } from 'dns';
import { isPrivate as isPrivateIP } from 'ip';
import got, { HTTPError, OptionsOfTextResponseBody, TimeoutError } from 'got';
import { MOTHERSHIP_GRAPHQL_LINK, MOTHERSHIP_RELAY_WS_LINK } from '@app/consts';
import { apiManager } from '@app/core/api-manager';
import { validateApiKey } from '@app/core/utils/misc/validate-api-key';
import { validateApiKeyFormat } from '@app/core/utils/misc/validate-api-key-format';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { getRelayConnectionStatus, getRelayDisconnectionReason, getRelayReconnectingTimeout } from '@app/mothership/get-relay-connection-status';
import type { Context } from '@app/graphql/schema/utils';
import { logger } from '@app/core/log';
import { RelayStates } from '@app/graphql/relay-state';
import { getAllowedOrigins } from '@app/common/allowed-origins';
import { version } from '@app/../package.json';
import { getMinigraphqlConnectionStatus } from '@app/mothership/get-mini-graphql-connection-status';
import { promisify } from 'util';

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
	minigraphql: {
		connected: boolean;
	};
	cloud: { status: 'ok'; error: undefined; ip: string } | { status: 'error'; error: string };
	allowedOrigins: string[];
};

const createResponse = (cloud: Cloud): Cloud => {
	return {
		...cloud,
		error: cloud.apiKey.error ?? cloud.relay.error ?? cloud.cloud.error
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

const hostname = 'mothership.unraid.net';

/**
 * Check if the local and network resolvers are able to see mothership
 *
 * See: https://nodejs.org/docs/latest/api/dns.html#dns_implementation_considerations
 */
const checkDNS = async () => {
	try {
		// Check the local resolver like "ping" does
		const local = await promisify(lookupDNS)(hostname).then(({ address }) => address);

		// Check the DNS server the server has set
		// This does a DNS query on the network
		const network = await promisify(resolveDNS)(hostname).then(([address]) => address);

		// The user's server and the DNS server they're using are returning different results
		if (local !== network) throw new Error(`Local and network resolvers showing different IP for "${hostname}". [local="${local}"] [network="${network}"]`);

		// The user likely has a PI-hole or something similar running.
		if (isPrivateIP(local)) throw new Error(`"${hostname}" is being resolved to a private IP. [IP=${local}]`);

		return { cloudIp: local };
	} catch (error: unknown) {
		if (!(error instanceof Error)) throw new Error(`Unknown Error "${error as string}"`);
		return { error };
	}
};

const checkMothership = async (): Promise<Cloud['cloud']> => {
	logger.trace('Cloud endpoint: Checking mothership');

	try {
		const apiVersion = version;
		const apiKey = apiManager.cloudKey;
		if (!apiKey) throw new Error('API key is missing');

		// // Check DNS
		// const { error: DNSError, cloudIp } = await checkDNS();
		// if (DNSError) return { status: 'error', error: DNSError.message };

		const timeout = { request: 5_000 };
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

		return { status: 'ok', error: undefined, ip: cloudIp };
	} finally {
		logger.trace('Cloud endpoint: Done mothership');
	}
};

const checkMinigraphql = () => {
	logger.trace('Cloud endpoint: Checking mini-graphql');
	try {
		return {
			connected: getMinigraphqlConnectionStatus()
		};
	} finally {
		logger.trace('Cloud endpoint: Done mini-graphql');
	}
};

export default async (_: unknown, __: unknown, context: Context): Promise<Cloud> => {
	ensurePermission(context.user, {
		resource: 'cloud',
		action: 'read',
		possession: 'own'
	});

	// If the endpoint is mocked return the mocked data
	if (process.env.MOCK_CLOUD_ENDPOINT) {
		const result: Cloud = {
			error: process.env.MOCK_CLOUD_ENDPOINT_ERROR,
			apiKey: {
				valid: Boolean(process.env.MOCK_CLOUD_ENDPOINT_APIKEY_VALID ?? true),
				error: process.env.MOCK_CLOUD_ENDPOINT_APIKEY_ERROR
			} as unknown as Cloud['apiKey'],
			relay: {
				status: process.env.MOCK_CLOUD_ENDPOINT_RELAY_STATUS as RelayStates ?? 'connected',
				timeout: Number(process.env.MOCK_CLOUD_ENDPOINT_RELAY_TIMEOUT) ?? null,
				reason: process.env.MOCK_CLOUD_ENDPOINT_RELAY_REASON,
				error: process.env.MOCK_CLOUD_ENDPOINT_RELAY_ERROR
			} as unknown as Cloud['relay'],
			minigraphql: {
				connected: Boolean(process.env.MOCK_CLOUD_ENDPOINT_MINIGRAPHQL_CONNECTED)
			},
			cloud: {
				status: process.env.MOCK_CLOUD_ENDPOINT_MOTHERSHIP_STATUS as 'ok' | 'error' ?? 'ok',
				error: process.env.MOCK_CLOUD_ENDPOINT_MOTHERSHIP_ERROR,
				ip: process.env.MOCK_CLOUD_ENDPOINT_MOTHERSHIP_IP
			} as unknown as Cloud['cloud'],
			allowedOrigins: (process.env.MOCK_CLOUD_ENDPOINT_ALOWED_ORIGINS ?? '').split(',').filter(Boolean)
		};
		return result;
	}

	const [apiKey, mothership] = await Promise.all([checkApi(), checkMothership()]);

	const response = createResponse({
		apiKey,
		relay: checkRelay(),
		minigraphql: checkMinigraphql(),
		cloud: mothership,
		allowedOrigins: getAllowedOrigins()
	});

	return response;
};
