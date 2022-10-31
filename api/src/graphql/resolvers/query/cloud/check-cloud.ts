/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { logger } from '@app/core/log';
import { checkDNS } from '@app/graphql/resolvers/query/cloud/check-dns';
import { checkMothershipAuthentication } from '@app/graphql/resolvers/query/cloud/check-mothership-authentication';
import { checkMothershipRestarting } from '@app/graphql/resolvers/query/cloud/check-mothership-restarting';
import { Cloud } from '@app/graphql/resolvers/query/cloud/create-response';
import { getters, store } from '@app/store';
import { getCloudCache } from '@app/store/getters';
import { setCloudCheck } from '@app/store/modules/cache';
import { got } from 'got';

const mothershipBaseUrl = MOTHERSHIP_GRAPHQL_LINK.replace('/graphql', '');

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

/**
 * This is mainly testing the user's network config
 * If they cannot resolve this they may have it blocked or have a routing issue
 */
const checkCanReachMothership = async (apiVersion: string, apiKey: string): Promise<void> => {
	const mothershipCanBeResolved = await got.head(mothershipBaseUrl, createGotOptions(apiVersion, apiKey)).then(() => true).catch(() => false);
	if (!mothershipCanBeResolved) throw new Error(`Unable to connect to ${mothershipBaseUrl}`);
};

export const checkCloud = async (): Promise<Cloud['cloud']> => {
	logger.trace('Cloud endpoint: Checking mothership');

	try {
		const config = getters.config();
		const apiVersion = config.api.version;
		const apiKey = config.remote.apikey;
		if (!apiKey) throw new Error('API key is missing');

		const oldCheckResult = getCloudCache();
		if (oldCheckResult) {
			logger.trace('Using cached result for cloud check', oldCheckResult);
			return oldCheckResult;
		}

		// Check DNS
		const { cloudIp } = await checkDNS();

		// Check if we can reach mothership
		await checkCanReachMothership(apiVersion, apiKey);

		// Check auth, rate limiting, etc.
		await checkMothershipAuthentication(apiVersion, apiKey);

		// Check if we got a 1012 which means mothership is restarting
		checkMothershipRestarting();

		// All is good
		const result: Cloud['cloud'] = { status: 'ok', error: null, ip: cloudIp };
		// Cache for 10 minutes
		store.dispatch(setCloudCheck(result));
		return result;
	} catch (error: unknown) {
		if (!(error instanceof Error)) throw new Error(`Unknown Error "${error as string}"`);
		return { status: 'error', error: error.message };
	} finally {
		logger.trace('Cloud endpoint: Done mothership');
	}
};
