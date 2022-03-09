/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import got, { HTTPError, OptionsOfTextResponseBody } from 'got';
import { MOTHERSHIP_GRAPHQL_LINK } from '../../../consts';
import { apiManager } from '../../../core/api-manager';
import { validateApiKey } from '../../../core/utils/misc/validate-api-key';
import { validateApiKeyFormat } from '../../../core/utils/misc/validate-api-key-format';
import { ensurePermission } from '../../../core/utils/permissions/ensure-permission';
import { getRelayConnectionStatus } from '../../../mothership/get-relay-connection-status';
import type { Context } from '../../schema/utils';
import { version } from '../../../../package.json';

const mothershipBaseUrl = MOTHERSHIP_GRAPHQL_LINK.replace('/graphql', '');

type RelayStates = 'connecting' | 'open' | 'closing' | 'closed' | 'unknown';

type Response = {
	error?: string;
	apiKey: { valid: true; error: undefined } | { valid: false; error: string };
	relay: { status: RelayStates; error: undefined } | { status: RelayStates; error: string };
	mothership: { status: 'ok'; error: undefined } | { status: 'error'; error: string };
};

const createResponse = (options: Response): Response => {
	return {
		...options,
		error: options.apiKey.error ?? options.relay.error ?? options.mothership.error
	};
};

const checkApi = async (): Promise<Response['apiKey']> => {
	try {
		// Check if we have an API key loaded for my servers
		const apiKey = apiManager.getKey('my_servers')?.key;
		if (!apiKey) throw new Error('API key is missing');

		// Key format must be valid
		validateApiKeyFormat(apiKey);

		// Key must pass key-server validation
		await validateApiKey(apiKey);
		return { valid: true, error: undefined };
	} catch (error: unknown) {
		if (!(error instanceof Error)) throw new Error(`Unknown error "${error as string}"`);
		return {
			valid: false,
			error: error.message
		};
	}
};

const checkRelay = (): Response['relay'] => ({
	status: getRelayConnectionStatus().toLowerCase() as RelayStates,
	error: undefined
});

const checkMothershipAuthentication = async (url: string, options: OptionsOfTextResponseBody) => {
	try {
		// Check if we're rate limited, etc.
		// This will throw if there is a non 2XX/3XX code
		await got.head(url, options);
	} catch (error: unknown) {
		if (error instanceof HTTPError) {
			switch (error.response.statusCode) {
				case 429: {
					const retryAfter = error.response.headers['retry-after'];
					throw new Error(retryAfter ? `${url} is rate limited for another ${retryAfter} seconds` : `${mothershipBaseUrl} is rate limited`);
				}

				case 401:
					throw new Error('Invalid credentials');
				default:
					throw new Error(`Failed to connect to ${url} with a "${error.response.statusCode}" HTTP error.`);
			}
		}

		throw new Error('Unknown Error', { cause: error as Error });
	}
};

const checkMothership = async (): Promise<Response['mothership']> => {
	const apiVersion = version;
	const apiKey = apiManager.getKey('my_servers')?.key;
	if (!apiKey) throw new Error('API key is missing');

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
		await checkMothershipAuthentication(MOTHERSHIP_GRAPHQL_LINK, options);
	} catch (error: unknown) {
		if (!(error instanceof Error)) throw new Error(`Unknown Error "${(error as Error)?.message}"`);
		return { status: 'error', error: error.message };
	}

	return { status: 'ok', error: undefined };
};

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'cloud',
		action: 'read',
		possession: 'own'
	});

	return createResponse({
		apiKey: await checkApi(),
		relay: checkRelay(),
		mothership: await checkMothership()
	});
};
