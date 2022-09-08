import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { shouldBeConnectedToCloud } from '@app/mothership/should-be-connect-to-cloud';
import { GraphQLError } from 'graphql';
import { CachedServer, CachedServers, userCache } from '@app/cache/user';
import { apiManager } from '@app/core/api-manager';
import { mothershipLogger } from '@app/core/log';
import { pubsub } from '@app/core/pubsub';
import { miniGraphqlStore } from '@app/mothership/store';
import { MinigraphClient } from './minigraph-client';
import { isKeySubscribed, SubscriptionKey } from '@app/store/modules/minigraph';

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

		const isSubscribedToServers = await isKeySubscribed(SubscriptionKey.SERVERS);

		if (!isSubscribedToServers && apiManager.cloudKey) {
			mothershipLogger.debug('Subscribing to servers');
			await subscribeToServers(apiManager.cloudKey);
		}

		if (isSubscribedToServers) {
			mothershipLogger.debug('Already subscribed to servers, skipping resubscribe');
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

	const nextFn = async ({ data, errors }: { data?: { servers: CachedServer[] } | null | undefined; errors?: readonly GraphQLError[] | undefined }) => {
		if (errors && errors.length > 0) {
			mothershipLogger.error('Failed subscribing to %s', MOTHERSHIP_GRAPHQL_LINK);
			errors.forEach(error => {
				mothershipLogger.error(error);
			});
			return;
		}

		if (data) {
			mothershipLogger.addContext('data', data);
			mothershipLogger.debug('Received subscription data for %o', data.servers);
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
			mothershipLogger.debug('Failed to get subscription data for servers');
		}
	};

	await MinigraphClient.subscribe({ query, nextFn, subscriptionKey: SubscriptionKey.SERVERS });
};

