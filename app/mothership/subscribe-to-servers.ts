import { pubsub, log as logger } from '../core';
import { SubscriptionClient } from 'graphql-subscriptions-client';
import { MOTHERSHIP_GRAPHQL_LINK, ONE_SECOND } from '../consts';
import { userCache, CachedServers } from '../cache';

const log = logger.createChild({ prefix: 'subscribe-to-servers' });
const client = new SubscriptionClient(MOTHERSHIP_GRAPHQL_LINK, {
	reconnect: true,
	lazy: true,
	minTimeout: ONE_SECOND * 30,
	connectionCallback: errors => {
		try {
			if (errors) {
				// Log all errors
				errors.forEach((error: any) => {
					// [error] {"message":"","locations":[{"line":2,"column":13}],"path":["servers"],"extensions":{"code":"INTERNAL_SERVER_ERROR","exception":{"fatal":false,"extras":{},"name":"AppError","status":500}}} [./dist/index.js:24646]
					log.error('Failed connecting to %s code=%s reason="%s"', MOTHERSHIP_GRAPHQL_LINK, error.extensions.code, error.message);
				});
			}
		} catch {}
	}
});

export const subscribeToServers = async (apiKey: string) => {
	log.silly('Subscribing to servers with %s', apiKey);
	const query = client.request({
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
			log.silly('Got data back with %s errors', errors?.length ?? 0);
			log.silly('Got data %j', data);
			log.silly('Got errors %s', errors);

			if (errors) {
				// Log all errors
				errors.forEach((error: any) => {
					log.error('Failed subscribing to %s code=%s reason="%s"', MOTHERSHIP_GRAPHQL_LINK, error.extensions.code, error.message);
				});

				return;
			}

			// Update internal cache
			userCache.set<CachedServers>('mine', {
				servers: data.servers
			});

			// Publish owner event
			const owner = data.servers[0].owner;
			await pubsub.publish('owner', owner);

			// Publish servers event
			await pubsub.publish('servers', {
				servers: data.servers
			});
		}
	});

	return subscription;
};
