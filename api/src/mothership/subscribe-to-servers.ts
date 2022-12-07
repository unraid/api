import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { type ExecutionResult } from 'graphql';
import { mothershipLogger } from '@app/core/log';
import { pubsub } from '@app/core/pubsub';
import { MinigraphClient } from './minigraph-client';
import { isKeySubscribed, MinigraphStatus, SubscriptionKey } from '@app/store/modules/minigraph';
import { getters, store } from '@app/store';
import { cacheServers, type Server } from '@app/store/modules/servers';

type ServersExecutionResult = ExecutionResult<{ servers: Server[] }>;

export const subscribeToServers = async (apiKey: string) => {
	const query = {
		query: `subscription servers ($apiKey: String!) {
            servers @auth(apiKey: $apiKey)
        }`,
		variables: {
			apiKey,
		},
	};

	const nextFn = async ({ data, errors }: ServersExecutionResult) => {
		if (errors && errors.length > 0) {
			mothershipLogger.error('Failed subscribing to %s', MOTHERSHIP_GRAPHQL_LINK);
			errors.forEach(error => {
				mothershipLogger.error(error);
			});
			return;
		}

		if (data) {
			mothershipLogger.trace('Received subscription data for servers %o', data.servers);

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

	await MinigraphClient.subscribe<ServersExecutionResult>({ query, nextFn, subscriptionKey: SubscriptionKey.SERVERS });
};

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
