import { logger, mothershipLogger } from '@app/core';
import { GraphqlClient } from '@app/mothership/graphql-client';
import { type ExecutionResult } from 'graphql-ws';
import { getters } from '@app/store';
import type { Server } from '@app/store/modules/servers';
import { print } from 'graphql';
import { queryServersFromMothershipDocument } from './graphql/generated/types';

export const getServers = async (apiKey: string) => {
	try {
		if (!getters.config().remote.apikey) {
			throw new Error('No API Key Set, Skipping Server Fetch');
		}

		logger.debug('Fetching servers for user');
		const query = {
			query: print(queryServersFromMothershipDocument),
			variables: {
				apiKey,
			},
		};

		mothershipLogger.debug('Testing servers endpoint with minigraph');
		const response = await GraphqlClient.query<ExecutionResult<{ servers: Server[] }>>(query);
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
