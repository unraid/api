import { SubscriptionClient } from 'graphql-subscriptions-client';
import WebSocket from 'ws';
import { MOTHERSHIP_GRAPHQL_LINK, ONE_SECOND } from '@app/consts';
import { shouldBeConnectedToCloud } from '@app/mothership/should-be-connect-to-cloud';
import { debounce } from '@app/mothership/debounce';
import { GraphQLError } from 'graphql';
import { CachedServer, CachedServers, userCache } from '@app/cache/user';
import { apiManager } from '@app/core/api-manager';
import { mothershipLogger } from '@app/core/log';
import { pubsub } from '@app/core/pubsub';
import { miniGraphqlStore } from '@app/mothership/store';
import { store } from '@app/store';

export const minigraphql = new SubscriptionClient(() => {
	const apiKey = apiManager.cloudKey ?? 'LARRYS_MAGIC_KEY';
	const url = new URL(MOTHERSHIP_GRAPHQL_LINK);
	url.username = store.getState().version.version;
	url.password = apiKey;
	return url.toString().replace('http', 'ws');
}, {
	reconnect: false,
	lazy: true,
	// Should wait 10s for a connection to start
	minTimeout: ONE_SECOND * 10,
	connectionParams: () => ({
		apiVersion: store.getState().version.version,
		apiKey: apiManager.cloudKey,
	}),
	connectionCallback(errors) {
		if (errors) miniGraphqlStore.connected = false;
		try {
			const graphqlErrors = errors as GraphQLError[] | undefined;
			if (graphqlErrors) {
				// Log first error
				if (graphqlErrors[0]?.extensions?.code) {
					mothershipLogger.addContext('code', graphqlErrors[0].extensions.code);
				}

				mothershipLogger.addContext('reason', graphqlErrors[0].message);
				mothershipLogger.error('Failed connecting to %s', MOTHERSHIP_GRAPHQL_LINK);
				mothershipLogger.removeContext('code');
				mothershipLogger.removeContext('reason');

				// Close the connection if it's still open
				if (minigraphql.status !== WebSocket.CLOSED) {
					minigraphql.close(true, true);
				}
			}
		} catch (error: unknown) {
			mothershipLogger.trace('Failed connecting to %s with "%s"', MOTHERSHIP_GRAPHQL_LINK, error);
		}
	},
});

// Fix client timing out while trying to connect
// @ts-expect-error accessing private field as we need to override this
(minigraphql.maxConnectTimeGenerator as { setMin: (n: number) => void }).setMin(10_000);
// @ts-expect-error accessing private field as we need to override this
minigraphql.maxConnectTimeGenerator.duration = () => minigraphql.maxConnectTimeGenerator.max as number;

// When minigraphql connects
minigraphql.onConnected(async () => {
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
}, undefined);

minigraphql.onError(() => {
	miniGraphqlStore.connected = false;
}, undefined);

minigraphql.onDisconnected(async () => {
	miniGraphqlStore.connected = false;
}, undefined);

export const checkGraphqlConnection = debounce(async () => {
	try {
		// Bail if we're in the middle of opening a connection
		if (minigraphql.status === WebSocket.CONNECTING) {
			return;
		}

		// Bail if we're already connected
		if (await shouldBeConnectedToCloud() && minigraphql.status === WebSocket.OPEN) {
			return;
		}

		// Close the connection if it's still up
		if (minigraphql.status !== WebSocket.CLOSED) {
			minigraphql.close(true, true);
		}

		// If we should be disconnected at this point then stay that way
		if (!await shouldBeConnectedToCloud()) {
			return;
		}

		// Reconnect
		mothershipLogger.debug('Connecting to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'));
		minigraphql.connect();
	} catch (error: unknown) {
		mothershipLogger.error('Failed to connect to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'), error);
	}
}, 5_000);

export const subscribeToServers = (apiKey: string) => {
	mothershipLogger.addContext('apiKey', apiKey);
	mothershipLogger.debug('Subscribing to servers');
	mothershipLogger.removeContext('apiKey');
	const query = minigraphql.request({
		query: `subscription servers ($apiKey: String!) {
            servers @auth(apiKey: $apiKey)
        }`,
		variables: {
			apiKey,
		},
	});

	// Subscribe
	const subscription = query.subscribe({
		async next({ data, errors }: { data: { servers: CachedServer[] }; errors: undefined | unknown[] }) {
			if (errors && errors.length > 0) {
				mothershipLogger.error('Failed subscribing to %s', MOTHERSHIP_GRAPHQL_LINK);
				errors.forEach(error => {
					mothershipLogger.error(error);
				});

				return;
			}

			mothershipLogger.addContext('data', data);
			mothershipLogger.debug('Received subscription data for %s', 'servers');
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
		},
	});

	return subscription;
};
