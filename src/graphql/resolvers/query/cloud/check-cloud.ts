/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { version } from '@app/../package.json';
import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { apiManager } from '@app/core/api-manager';
import { logger } from '@app/core/log';
import { checkDNS } from '@app/graphql/resolvers/query/cloud/check-dns';
import { checkMothershipAuthentication } from '@app/graphql/resolvers/query/cloud/check-mothership-authentication';
import { checkMothershipRestarting } from '@app/graphql/resolvers/query/cloud/check-mothership-restarting';
import { Cloud } from '@app/graphql/resolvers/query/cloud/create-response';
import got from 'got';

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
	if (!mothershipCanBeResolved) throw new Error(`Failed resolving ${mothershipBaseUrl}`);
};

export const checkCloud = async (): Promise<Cloud['cloud']> => {
	logger.trace('Cloud endpoint: Checking mothership');

	try {
		const apiVersion = version;
		const apiKey = apiManager.cloudKey;
		if (!apiKey) throw new Error('API key is missing');

		// Check DNS
		const { cloudIp } = await checkDNS();

		// Check if we can reach mothership
		await checkCanReachMothership(apiVersion, apiKey);

		// Check auth, rate limiting, etc.
		await checkMothershipAuthentication(apiVersion, apiKey);

		// Check if we got a 1012 which means mothership is restarting
		checkMothershipRestarting();

		// All is good
		return { status: 'ok', error: undefined, ip: cloudIp };
	} catch (error: unknown) {
		if (!(error instanceof Error)) throw new Error(`Unknown Error "${error as string}"`);
		return { status: 'error', error: error.message };
	} finally {
		logger.trace('Cloud endpoint: Done mothership');
	}
};
