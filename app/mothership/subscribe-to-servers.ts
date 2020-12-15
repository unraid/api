import { pubsub } from '../core';
import { SubscriptionClient } from 'graphql-subscriptions-client';
import { MOTHERSHIP_GRAPHQL_LINK } from '../consts';
import { userCache, CachedServers } from '../cache';
import { log } from '../core';

const client = new SubscriptionClient(MOTHERSHIP_GRAPHQL_LINK, {
    reconnect: true,
    lazy: true, // only connect when there is a query
    connectionCallback: (errors) => {
        if (errors) {
            // Log all errors
            errors.forEach((error: Error) => {
                log.error(error);
            });
        }
    }
});

client.on('error', (error) => {
    log.error('url="%s" message="%s"', MOTHERSHIP_GRAPHQL_LINK, error.message);
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
                errors.forEach((error: Error) => {
                    log.error(error);
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
