import { pubsub, mothershipLogger, apiManager } from '../core';
import { SubscriptionClient } from 'graphql-subscriptions-client';
import WebSocket from 'ws';
import { MOTHERSHIP_GRAPHQL_LINK, ONE_SECOND } from '../consts';
import { shouldBeConnectedToCloud } from './should-be-connect-to-cloud';
import { debounce } from './debounce';
import { GraphQLError } from 'graphql';
import { version } from '../../package.json';
import { CachedServer, CachedServers, userCache } from '../cache/user';

export const mothership = new SubscriptionClient(() => {
	const apiKey = apiManager.cloudKey ?? 'LARRYS_MAGIC_KEY';
	const url = new URL(MOTHERSHIP_GRAPHQL_LINK);
	url.username = version;
	url.password = apiKey;
	return url.toString().replace('http', 'ws');
}, {
	reconnect: false,
	lazy: true,
	minTimeout: ONE_SECOND * 30,
	connectionParams: () => ({
		apiVersion: version,
		apiKey: apiManager.cloudKey
	}),
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
		} catch (error: unknown) {
			mothershipLogger.trace('Failed connecting to %s with "%s"', MOTHERSHIP_GRAPHQL_LINK, error);
		}
	}
});

// Fix client timing out while trying to connect
// @ts-expect-error
mothership.maxConnectTimeGenerator.duration = () => mothership.maxConnectTimeGenerator.max;

mothership.onConnected(async () => {
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
	mothershipLogger.info('Connected to %s', MOTHERSHIP_GRAPHQL_LINK);
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
