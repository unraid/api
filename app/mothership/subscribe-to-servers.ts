import { pubsub, mothershipLog } from '../core';
import { SubscriptionClient } from 'graphql-subscriptions-client';
import { MOTHERSHIP_GRAPHQL_LINK, ONE_SECOND } from '../consts';
import { userCache, CachedServers } from '../cache';

export const mothership = new SubscriptionClient(MOTHERSHIP_GRAPHQL_LINK, {
	reconnect: true,
	lazy: true,
	minTimeout: ONE_SECOND * 30,
	connectionCallback: errors => {
		try {
			if (errors) {
				// Log all errors
				errors.forEach((error: any) => {
					// [error] {"message":"","locations":[{"line":2,"column":13}],"path":["servers"],"extensions":{"code":"INTERNAL_SERVER_ERROR","exception":{"fatal":false,"extras":{},"name":"AppError","status":500}}} [./dist/index.js:24646]
					mothershipLog.error('Failed connecting to %s code=%s reason="%s"', MOTHERSHIP_GRAPHQL_LINK, error.extensions.code, error.message);
				});
			}
		} catch {}
	}
});

export const subscribeToServers = (apiKey: string) => {
	mothershipLog.addContext('apiKey', apiKey);
	mothershipLog.debug('Subscribing to servers');
	mothershipLog.removeContext('apiKey');
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
			mothershipLog.debug('Got data back with %s errors', errors?.length ?? 0);
			mothershipLog.trace('Got data %j', data);
			mothershipLog.trace('Got errors %s', errors);

			// Log error
			if (errors) {
				mothershipLog.addContext('code', errors[0].extensions.code);
				mothershipLog.addContext('reason', errors[0].message);
				mothershipLog.error('Failed subscribing to %s', MOTHERSHIP_GRAPHQL_LINK);
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
