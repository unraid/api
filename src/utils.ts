import got from 'got';
import { GraphQLError } from 'graphql';
import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { mothershipLogger } from '@app/core';
import type { CachedServer } from '@app/cache/user';
import { version } from '@app/../package.json';

export const getServers = async (apiKey: string) => {
	try {
		const response = await got(MOTHERSHIP_GRAPHQL_LINK, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',

				Accept: 'application/json',
				'x-unraid-api-version': version as string,
				'x-api-key': apiKey,
			},
			body: JSON.stringify({
				query: 'query($apiKey: String!) { servers @auth(apiKey: $apiKey) { owner { username url avatar } guid apikey name status wanip lanip localurl remoteurl } }',
				variables: {
					apiKey,
				},
			}),
			timeout: {
				request: 5_000, // Wait for 5s at most
			},
			retry: {
				methods: ['POST'],
				limit: 5,
				errorCodes: ['429'],
			},
		});

		// Invalid API key?
		if (response.statusCode === 401) throw new Error('Invalid API key');

		const { data, errors } = JSON.parse(response.body) as { data: { servers: CachedServer[] }; errors?: GraphQLError[] };
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
