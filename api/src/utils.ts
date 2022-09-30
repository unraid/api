import { mothershipLogger } from '@app/core';
import { MinigraphClient } from '@app/mothership/minigraph-client';
import { ExecutionResult } from 'graphql-ws';
import { getters } from '@app/store';
import type { Server } from '@app/store/modules/servers';

export const getServers = async (apiKey: string) => {
	try {
		if (!getters.config().remote.apikey) {
			throw new Error('No API Key Set, Skipping Server Fetch');
		}

		const query = {
			query: 'query($apiKey: String!) { servers @auth(apiKey: $apiKey) { owner { username url avatar } guid apikey name status wanip lanip localurl remoteurl } }',
			variables: {
				apiKey,
			},
		};

		mothershipLogger.debug('Testing servers endpoint with minigraph');
		const response = await MinigraphClient.query<ExecutionResult<{ servers: Server[] }>>(query);
		mothershipLogger.trace('Got response from query: %o', response);

		const { data, errors } = response;
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
	}

	return [];
};
