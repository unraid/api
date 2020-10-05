import * as Sentry from '@sentry/node';
import { pubsub } from '@unraid/core';
import { SubscriptionClient } from 'graphql-subscriptions-client';
import { MOTHERSHIP_GRAPHQL_LINK } from '../consts';
import { userCache, CachedServers } from '../cache';
import { getServers } from '../utils';
import { mothershipServersEndpoints } from './mothership-server-endpoints';

const client = new SubscriptionClient(MOTHERSHIP_GRAPHQL_LINK, {
    reconnect: true,
    lazy: true, // only connect when there is a query
    connectionCallback: (error) => {
        if (error) {
            Sentry.captureException(error);
        }
    }
});

const difference = <T = string>(a: Set<T>, b: Set<T>) => new Set([...a].filter(x => !b.has(x)));

const processSubscription = (apiKey: string) => ({ data, errors }) => {
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
                    const oldServers = new Set(userCache.get<CachedServers>('mine')?.servers.map(server => server.apikey));
                    const newServers = new Set(servers.map(server => server.apikey));

                    const unsub = difference(oldServers, newServers);
                    const resub = difference(newServers, oldServers);

                    // unsub from old servers
                    unsub.forEach(apiKey => {
                        const subscription = mothershipServersEndpoints.get(apiKey);
                        subscription?.unsubscribe();
                    });

                    // Sub to new servers
                    resub.forEach(apiKey => {
                        if (!mothershipServersEndpoints.has(apiKey)) {
                            subscribeToServer(apiKey);
                        }
                    });

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
};

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
        next: processSubscription(apiKey)
    });
};
