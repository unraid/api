import { SubscriptionClient } from 'graphql-subscriptions-client';
import WebSocket from 'ws';
import { MOTHERSHIP_GRAPHQL_LINK, ONE_SECOND } from '@app/consts';
import { shouldBeConnectedToCloud } from '@app/mothership/should-be-connect-to-cloud';
import { debounce } from '@app/mothership/debounce';
import { GraphQLError } from 'graphql';
import { CachedServer, CachedServers, userCache } from '@app/cache/user';
import { apiManager } from '@app/core/api-manager';
import { logger, mothershipLogger } from '@app/core/log';
import { pubsub } from '@app/core/pubsub';
import { miniGraphqlStore } from '@app/mothership/store';
import { getRelayHeaders } from '@app/mothership/utils/get-relay-headers';
import { getters } from '@app/store';
import { Client } from 'graphql-ws';
import { MinigraphClient } from './minigraph-client';


/*
// When minigraphql connects
minigraphql.on('connected', async () => {
	mothershipLogger.log('Connected EVENT MINIGRAPH')
	miniGraphqlStore.connected = true;
	const apiKey = apiManager.cloudKey;

	if (!apiKey) {
		mothershipLogger.error('Connection attempted with no API key, disconnecting.');
		return;
	}

	// Check if we should be connected
	if (await shouldBeConnectedToCloud().then(shouldBeConnected => !shouldBeConnected).catch(() => false)) {
		mothershipLogger.debug('Connected but we should be disconnected, disconnecting.');
		return;
	}

	// Sub to /servers endpoint
	mothershipLogger.info('Connected to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'));
	subscribeToServers(apiKey);
}); */

let isSubscribedToServers = false
export const checkGraphqlConnection = async () => {
	try {
		// Bail if we're in the middle of opening a connection
		if (miniGraphqlStore.status === 'CONNECTING') {
			mothershipLogger.debug('Bailing on trying to fix graph connection when connecting');
			return;
		}

		// Bail if we're already connected
		if (await shouldBeConnectedToCloud() && miniGraphqlStore.status === 'CONNECTED') {
			return;
		}

		if (!isSubscribedToServers && apiManager.cloudKey) {
			mothershipLogger.debug('Subscribing to servers')
			subscribeToServers(apiManager.cloudKey, MinigraphClient.getClient())
		}
	} catch (error: unknown) {
		mothershipLogger.error('Failed to connect to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'), error);
	}
}


export const subscribeToServers = (apiKey: string, client: Client) => {
	mothershipLogger.addContext('apiKey', apiKey);
	mothershipLogger.debug('Subscribing to servers');
	mothershipLogger.removeContext('apiKey');
	const query = {
		query: `subscription servers ($apiKey: String!) {
            servers @auth(apiKey: $apiKey)
        }`,
		variables: {
			apiKey,
		}
	}
	client.subscribe(query, {
		async next({data, errors}: { data?: { servers: CachedServer[] } | null | undefined; errors: readonly GraphQLError[] | undefined }) {
			if (errors && errors.length > 0) {
				mothershipLogger.error('Failed subscribing to %s', MOTHERSHIP_GRAPHQL_LINK);
				errors.forEach(error => {
					mothershipLogger.error(error);
				});

				return;
			}

			if (data) {
				mothershipLogger.addContext('data', data);
				mothershipLogger.debug('Received subscription data for %s', data.servers);
				mothershipLogger.removeContext('data');
	
				// Update internal cache
				userCache.set<CachedServers>('mine', {
					servers: data.servers,
				});
	
				// Publish owner event
				const { owner } = data.servers[0];
				await pubsub.publish('owner', {
					owner,
				});
	
				// Publish servers event
				await pubsub.publish('servers', {
					servers: data.servers,
				});
			} else {
				mothershipLogger.debug('Failed to get subscription data for servers')
			}
		},
		async error(error) {
			mothershipLogger.error('FAILED_SENDING_NOTIFICATION', error);
		},
		complete() {}
	})
};
