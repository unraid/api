import { pubsub, mothershipLogger, apiManager } from '../core';
import { SubscriptionClient } from 'graphql-subscriptions-client';
import WebSocket from 'ws';
import { MOTHERSHIP_GRAPHQL_LINK, ONE_SECOND } from '../consts';
import { userCache, CachedServers } from '../cache';
import { shouldBeConnectedToCloud } from './should-be-connect-to-cloud';
import { debounce } from './debounce';

export const mothership = new SubscriptionClient(MOTHERSHIP_GRAPHQL_LINK, {
	reconnect: false,
	lazy: false,
	minTimeout: ONE_SECOND * 30,
	connectionCallback: errors => {
		try {
			if (errors) {
				// Log first error
				if ((errors[0] as any)?.extensions?.code) {
					mothershipLogger.addContext('code', (errors[0] as any).extensions.code);
				}

				mothershipLogger.addContext('reason', errors[0].message);
				mothershipLogger.error('Failed connecting to %s', MOTHERSHIP_GRAPHQL_LINK);
			}
		} catch {}
	}
});

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
		if (mothership) {
			mothership.close(true, true);
		}

		// If we should be disconnected at this point then stay that way
		if (!await shouldBeConnectedToCloud()) {
			return;
		}

		// Reconnect
		mothership.connect();
		subscribeToServers(apiManager.getKey('my_servers')?.key!);
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
		next: async ({ data, errors }) => {
			mothershipLogger.debug('Got data back with %s errors', errors?.length ?? 0);
			mothershipLogger.trace('Got data %j', data);
			mothershipLogger.trace('Got errors %s', errors);

			// Log error
			if (errors) {
				mothershipLogger.addContext('code', errors[0].extensions.code);
				mothershipLogger.addContext('reason', errors[0].message);
				mothershipLogger.error('Failed subscribing to %s', MOTHERSHIP_GRAPHQL_LINK);
				return;
			}

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
