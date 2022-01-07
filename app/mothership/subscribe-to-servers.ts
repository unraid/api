import { pubsub, mothershipLogger, apiManager } from '../core';
import { SubscriptionClient } from 'graphql-subscriptions-client';
import WebSocket from 'ws';
import { MOTHERSHIP_GRAPHQL_LINK, ONE_SECOND } from '../consts';
import { userCache, CachedServers, CachedServer } from '../cache';
import { shouldBeConnectedToCloud } from './should-be-connect-to-cloud';
import { debounce } from './debounce';
import { GraphQLError } from 'graphql';

export const mothership = new SubscriptionClient(MOTHERSHIP_GRAPHQL_LINK, {
	reconnect: false,
	lazy: false,
	minTimeout: ONE_SECOND * 30,
	connectionCallback: errors => {
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
				if (mothership.status !== WebSocket.CLOSED) {
					mothership.close(true, true);
				}
			}
		} catch {}
	}
});

mothership.onConnected(async () => {
	const apiKey = apiManager.getKey('my_servers')?.key;

	// Check if we should be connected
	const shouldDisconnect = !(await shouldBeConnectedToCloud());
	if (!apiKey || shouldDisconnect) {
		mothershipLogger.addContext('apiKey', apiKey);
		mothershipLogger.addContext('shouldDisconnect', shouldDisconnect);
		mothershipLogger.debug('Connected but apiKey is missing or we should be disconnected');
		mothershipLogger.removeContext('apiKey');
		mothershipLogger.removeContext('shouldDisconnect');
		return;
	}

	mothershipLogger.debug('Connected');
	subscribeToServers(apiKey);
}, undefined);

export const checkGraphqlConnection = debounce(async () => {
	try {
		// Bail if we're in the middle of opening a connection
		if (mothership.status === WebSocket.CONNECTING) {
			return;
		}

		// Bail if we're already connected
		if (await shouldBeConnectedToCloud() && mothership.status === WebSocket.OPEN) {
			return;
		}

		// Close the connection if it's still up
		if (mothership.status !== WebSocket.CLOSED) {
			mothership.close(true, true);
		}

		// If we should be disconnected at this point then stay that way
		if (!await shouldBeConnectedToCloud()) {
			return;
		}

		// Reconnect
		mothership.connect();
		mothership.onConnected(() => {
			subscribeToServers(apiManager.getKey('my_servers')?.key!);
		}, undefined);
	} catch (error: unknown) {
		console.log(error);
	}
}, 5_000);

export const subscribeToServers = (apiKey: string) => {
	mothershipLogger.addContext('apiKey', apiKey);
	mothershipLogger.debug('Subscribing to servers');
	mothershipLogger.removeContext('apiKey');
	const query = mothership.request({
		query: `subscription servers ($apiKey: String!) {
            servers @auth(apiKey: $apiKey)
        }`,
		variables: {
			apiKey
		}
	});

	// Subscribe
	const subscription = query.subscribe({
		next: async ({ data, errors }: { data: { servers: CachedServer[] }; errors: undefined | unknown[] }) => {
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
				servers: data.servers
			});

			// Publish owner event
			const owner = data.servers[0].owner;
			await pubsub.publish('owner', {
				owner
			});

			// Publish servers event
			await pubsub.publish('servers', {
				servers: data.servers
			});
		}
	});

	return subscription;
};
