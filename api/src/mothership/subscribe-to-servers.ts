import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { GraphQLError } from 'graphql';
import { mothershipLogger } from '@app/core/log';
import { pubsub } from '@app/core/pubsub';
import { MinigraphClient } from './minigraph-client';
import { isKeySubscribed, MinigraphStatus, SubscriptionKey } from '@app/store/modules/minigraph';
import { getters, store } from '@app/store';
import { cacheServers, Server } from '@app/store/modules/servers';

export const subscribeToMinigraphServers = async () => {
	try {
		// Bail if we're in the middle of opening a connection
		if (getters.minigraph().status === MinigraphStatus.CONNECTING) {
			mothershipLogger.debug('Bailing on trying to fix graph connection when connecting');
			return;
		}

		const isSubscribedToServers = await isKeySubscribed(SubscriptionKey.SERVERS);

		if (isSubscribedToServers) {
			mothershipLogger.debug('Already subscribed to servers, skipping resubscribe');
			return;
		}

		if (!isSubscribedToServers && getters.config().remote.apikey) {
			mothershipLogger.debug('Subscribing to servers');
			await subscribeToServers(getters.config().remote.apikey);
		}
	} catch (error: unknown) {
		mothershipLogger.error('Failed to connect to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'), error);
	}
};

export const subscribeToServers = async (apiKey: string) => {
	mothershipLogger.addContext('apiKey', apiKey);
	mothershipLogger.debug('Subscribing to servers');
	mothershipLogger.removeContext('apiKey');
	const query = {
		query: `subscription servers ($apiKey: String!) {
            servers @auth(apiKey: $apiKey)
        }`,
		variables: {
			apiKey,
		},
	};

	const nextFn = async ({ data, errors }: { data?: { servers: Server[] } | null | undefined; errors?: readonly GraphQLError[] | undefined }) => {
		if (errors && errors.length > 0) {
			mothershipLogger.error('Failed subscribing to %s', MOTHERSHIP_GRAPHQL_LINK);
			errors.forEach(error => {
				mothershipLogger.error(error);
			});
			return;
		}

		if (data) {
			mothershipLogger.debug('Received subscription data for %o', data.servers);

			// Update servers cache
			store.dispatch(cacheServers(data.servers));

			// Publish owner event
			await pubsub.publish('owner', {
				owner: data?.servers?.[0]?.owner,
			});

			// Publish servers event
			await pubsub.publish('servers', {
				servers: data.servers,
			});
		} else {
			mothershipLogger.debug('Failed to get subscription data for servers');
		}
	};

	await MinigraphClient.subscribe({ query, nextFn, subscriptionKey: SubscriptionKey.SERVERS });
};

