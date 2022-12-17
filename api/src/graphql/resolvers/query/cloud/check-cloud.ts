/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { FIVE_DAYS_SECS, MOTHERSHIP_GRAPHQL_LINK, ONE_DAY_SECS } from '@app/consts';
import { logger } from '@app/core/log';
import { checkDNS } from '@app/graphql/resolvers/query/cloud/check-dns';
import { checkMothershipAuthentication } from '@app/graphql/resolvers/query/cloud/check-mothership-authentication';
import { getters, store } from '@app/store';
import { getCloudCache, getDnsCache } from '@app/store/getters';
import { setCloudCheck, setDNSCheck } from '@app/store/modules/cache';
import { got } from 'got';
import { type CloudResponse, type Resolvers, MinigraphStatus } from '@app/graphql/generated/api/types';

const mothershipBaseUrl = new URL(MOTHERSHIP_GRAPHQL_LINK).origin;

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

/**
 * Run a more performant cloud check with permanent DNS checking
 */
const fastCloudCheck = async (): Promise<CloudResponse> => {
	const result = { status: 'ok', error: null, ip: 'NO_IP_FOUND' };

	const cloudIp = getDnsCache()?.cloudIp ?? null;
	if (!cloudIp) {
		try {
			result.ip = (await checkDNS()).cloudIp;
			store.dispatch(setDNSCheck({ cloudIp: result.ip, ttl: FIVE_DAYS_SECS, error: null }));
		} catch (error: unknown) {
			logger.warn('Failed to fetch DNS, but Minigraph is connected - continuing');
			result.ip = `ERROR: ${error instanceof Error ? error.message : 'Unknown Error'}`;
			// Don't set an error since we're actually connected to the cloud
			store.dispatch(setDNSCheck({ cloudIp: result.ip, ttl: ONE_DAY_SECS, error: null }));
		}
	}

	return result;
};

export const checkCloud: NonNullable<Resolvers['Cloud']>['cloud'] = async () => {
	logger.trace('Cloud endpoint: Checking mothership');

	try {
		const config = getters.config();
		const apiVersion = config.api.version;
		const apiKey = config.remote.apikey;
		const graphqlStatus = getters.minigraph().status;
		const result = { status: 'ok', error: null, ip: 'NO_IP_FOUND' };

		// If minigraph is connected, skip the follow cloud checks
		if (graphqlStatus === MinigraphStatus.CONNECTED) {
			return await fastCloudCheck();
		}

		// Check GraphQL Conneciton State, if it's broken, run these checks
		if (!apiKey) throw new Error('API key is missing');

		const oldCheckResult = getCloudCache();
		if (oldCheckResult) {
			logger.trace('Using cached result for cloud check', oldCheckResult);
			return oldCheckResult;
		}

		// Check DNS
		result.ip = (await checkDNS()).cloudIp;
		// Check if we can reach mothership
		await checkCanReachMothership(apiVersion, apiKey);

		// Check auth, rate limiting, etc.
		await checkMothershipAuthentication(apiVersion, apiKey);

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
