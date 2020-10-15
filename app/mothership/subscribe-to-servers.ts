import * as Sentry from '@sentry/node';
import { pubsub } from '@unraid/core';
import { SubscriptionClient } from 'graphql-subscriptions-client';
import { MOTHERSHIP_GRAPHQL_LINK } from '../consts';
import { userCache, CachedServers } from '../cache';

const client = new SubscriptionClient(MOTHERSHIP_GRAPHQL_LINK, {
    reconnect: true,
    lazy: true, // only connect when there is a query
    connectionCallback: (error) => {
        if (error) {
            Sentry.captureException(error);
        }
    }
});

export const subscribeToServers = (apiKey: string) => {
    return client.request({
        query: `subscription servers ($apiKey: String!) {
            servers @auth(apiKey: $apiKey)
        }`,
        variables: {
            apiKey
        }
    })
    .subscribe({
        next: ({ data, errors }) => {
            if (errors) {
                // Send all errors to Sentry
                errors.forEach((error: Error) => {
                    Sentry.captureException(error);
                });
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
};
