import { pubsub } from '../core';
import { SubscriptionClient } from 'graphql-subscriptions-client';
import { MOTHERSHIP_GRAPHQL_LINK } from '../consts';
import { userCache, CachedServers } from '../cache';
import { log as logger } from '../core';

const log = logger.createChild({ prefix: '[@unraid/subscribe-to-servers]: '});
const client = new SubscriptionClient(MOTHERSHIP_GRAPHQL_LINK, {
    reconnect: true,
    lazy: true, // only connect when there is a query
    connectionCallback: (errors) => {
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

client.on('error', (error) => {
    log.debug('url="%s" message="%s"', MOTHERSHIP_GRAPHQL_LINK, error.message);
    client.close();
}, null);

export const subscribeToServers = async (apiKey: string) => {
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
        next: ({ data, errors }) => {
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
        
            // Update subscribers
            pubsub.publish('servers', {
                servers: data.servers
            });
        }
    });

    return subscription;
};
