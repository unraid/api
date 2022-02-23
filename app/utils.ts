import { fetch } from './common/fetch';
import { MOTHERSHIP_GRAPHQL_LINK } from './consts';
import { CachedServer } from './cache';
import { version } from '../package.json';
import { mothershipLogger } from './core';
import { GraphQLError } from 'graphql';
import { sleep } from './core/utils';

export const getServers = async (apiKey: string) => {
	try {
		const response = await fetch(MOTHERSHIP_GRAPHQL_LINK, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				'x-unraid-api-version': version,
				'x-api-key': apiKey
			},
			body: JSON.stringify({
				query: 'query($apiKey: String!) { servers @auth(apiKey: $apiKey) { owner { username url avatar } guid apikey name status wanip lanip localurl remoteurl } }',
				variables: {
					apiKey
				}
			}),
			retryOptions: {
				retryTimeout: 100, // Default behaviour
				maxRetries: 3,
				status_429: { // Retry behaviour for 429 errors only
					retryTimeout: async retryContext => {
						const retryAfter = retryContext.response.headers.get('retry-after');
						await sleep(retryAfter * 1000);
					},
					maxRetries: 5
				}
			}
		});

		// Invalid API key?
		if (response.status === '401') throw new Error('Invalid API key');

		const { data, errors } = await response.json() as { data: { servers: CachedServer[] }; errors?: GraphQLError[] };
		if (errors) {
			throw new Error(errors[0].message);
		}

		return data.servers;
	} catch (error: unknown) {
		mothershipLogger.addContext('error', error);
		mothershipLogger.error('Failed getting servers');
		mothershipLogger.removeContext('error');
		return [];
	}
};
