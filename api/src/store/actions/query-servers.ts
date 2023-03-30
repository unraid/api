import { mothershipLogger } from '@app/core/log';
import { pubsub } from '@app/core/pubsub';
import { type Server } from '@app/graphql/generated/client/graphql';
import { GET_SERVERS_FROM_MOTHERSHIP } from '@app/graphql/mothership/queries';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { type RootState } from '@app/store/index';
import { notNull } from '@app/utils';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const queryServers = createAsyncThunk<Server[], void, { state: RootState }>('servers/query', async (_, { getState }) => {
	const state = getState();
	const apiKey = state.config.remote.apikey;
	const client = GraphQLClient.getInstance();
	if (!client || !apiKey) {
		throw new Error('Unable to use client - state must not be loaded');
	}

	mothershipLogger.trace('Querying Servers');
	const queryResult = await client.query({
        query: GET_SERVERS_FROM_MOTHERSHIP,
        variables: { apiKey },
        fetchPolicy: 'no-cache',
    });
	if (queryResult.data.servers) {
		const serversToSet = queryResult.data.servers.filter(notNull);
		mothershipLogger.addContext('result', serversToSet);
		mothershipLogger.trace('Got %s servers for user', serversToSet.length);
		mothershipLogger.removeContext('result');

		if (serversToSet.length > 0) {
			// Publish owner event
			await pubsub.publish('owner', {
				owner: serversToSet[0].owner,
			});

			// Publish servers event
			await pubsub.publish('servers', {
				servers: serversToSet,
			});
		}

		return serversToSet;
	}

	if (queryResult.errors) {
		mothershipLogger.error('Error querying servers: %s', queryResult.errors.join(','));
	}

	return [];
});
