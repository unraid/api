import { GraphQLError } from 'graphql';
import { mothershipLogger } from '@app/core';
import type { CachedServer } from '@app/cache/user';
import { MinigraphClient } from '@app/mothership/minigraph-client';
import { ExecutionResult } from 'graphql-ws';

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

		const { data, errors } = response as ExecutionResult<{ servers: CachedServer[] }>;
		if (data) {
			return data.servers;
		}

		if (errors) {
			throw new Error(`GraphQL Errors from getServers(): ${errors.map(error => error.message).join(', ')}`);
		}
	} catch (error: unknown) {
		mothershipLogger.addContext('error', error);
		mothershipLogger.error('Failed getting servers', error);
		mothershipLogger.removeContext('error');
		return [];
	}
};
