/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import got from 'got';
import { MOTHERSHIP_GRAPHQL_LINK } from '../../../consts';
import { apiManager } from '../../../core/api-manager';
import { validateApiKey } from '../../../core/utils/misc/validate-api-key';
import { validateApiKeyFormat } from '../../../core/utils/misc/validate-api-key-format';
import { ensurePermission } from '../../../core/utils/permissions/ensure-permission';
import { getRelayConnectionStatus } from '../../../mothership';
import type { Context } from '../../schema/utils';

const mothershipBaseUrl = MOTHERSHIP_GRAPHQL_LINK.replace('/graphql', '');

type RelayStates = 'connecting' | 'open' | 'closing' | 'closed';

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

const checkMothership = async (): Promise<Response['mothership']> => {
	// Check if we can reach mothership
	// This is mainly testing the user's network config
	// If they cannot resolve this they may have it blocked or have a routing issue
	const mothershipCanBeResolved = await got.head(mothershipBaseUrl, { timeout: { request: 1_000 } }).then(() => true).catch(() => false);
	if (!mothershipCanBeResolved) return { status: 'error', error: `Failed resolving ${mothershipBaseUrl}` };

	// Check if we're rate limited
	const mothershipIsRateLimitingUs = await got.head(MOTHERSHIP_GRAPHQL_LINK, { timeout: { request: 1_000 } }).then(() => false).catch(() => true);
	if (mothershipIsRateLimitingUs) return { status: 'error', error: `${mothershipBaseUrl} is rate limited` };

	return { status: 'ok', error: undefined };
};

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'cloud',
		action: 'read',
		possession: 'any'
	});

	return createResponse({
		apiKey: await checkApi(),
		relay: checkRelay(),
		mothership: await checkMothership()
	});
};
