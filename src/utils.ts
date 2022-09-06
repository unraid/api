import { GraphQLError } from 'graphql';
import { mothershipLogger } from '@app/core';
import type { CachedServer } from '@app/cache/user';
import { MinigraphClient } from '@app/mothership/minigraph-client';

export const getServers = async (apiKey: string) => {
	try {
		const query = {
			query: 'query($apiKey: String!) { servers @auth(apiKey: $apiKey) { owner { username url avatar } guid apikey name status wanip lanip localurl remoteurl } }',
			variables: {
				apiKey,
			},
		};
		mothershipLogger.debug('Testing servers endpoint with minigraph');
		const response = await MinigraphClient.query(query);
		mothershipLogger.trace('Got response from query: %o', response);
		// Invalid API key?
		if (response.statusCode === 401) throw new Error('Invalid API key');

		const { data } = response as { data: { servers: CachedServer[] }; errors?: GraphQLError[] };

		return data.servers;
	} catch (error: unknown) {
		mothershipLogger.addContext('error', error);
		mothershipLogger.error('Failed getting servers', error);
		mothershipLogger.removeContext('error');
		return [];
	}
};
