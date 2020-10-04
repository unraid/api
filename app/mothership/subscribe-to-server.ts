import * as Sentry from '@sentry/node';
import { pubsub } from '@unraid/core';
import { SubscriptionClient } from 'graphql-subscriptions-client';
import { MOTHERSHIP_GRAPHQL_LINK } from '../consts';
import { userCache, CachedServers } from '../cache';
import { getServers } from '../utils';

const client = new SubscriptionClient(MOTHERSHIP_GRAPHQL_LINK, {
    reconnect: true,
    lazy: true, // only connect when there is a query
    connectionCallback: (error) => {
        if (error) {
            Sentry.captureException(error);
        }
    }
});

export const subscribeToServer = (apiKey: string) => {
    // For each server subscribe to it's endpoint
    return client.request({
        query: `subscription status ($apiKey: String!) {
            status @auth(apiKey: $apiKey)
        }`,
        variables: {
            apiKey
        }
    })
    .subscribe({
        next({ data, errors }) {
            if (errors) {
                // Send all errors to Sentry
                errors.forEach((error: Error) => {
                    Sentry.captureException(error);
                });
            }
            // Only update if we actually have data
            if (data && data.status) {
                const servers = userCache.get<CachedServers>('mine');
                const server = servers?.servers.find(server => server.apikey === apiKey);
                if (server && server.status && server.status !== data.status) {
                    getServers(apiKey).then(servers => {
                        if (servers) {
                            // Update internal cache
                            userCache.set<CachedServers>('mine', {
                                servers
                            });

                            // Update subscribers
                            pubsub.publish('servers', servers);
                        }
                    });
                }
            }
        }
    });
};
