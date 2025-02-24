import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client/core/index.js';
import { onError } from '@apollo/client/link/error/index.js';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions/index.js';
import { getMainDefinition } from '@apollo/client/utilities/index.js';
import { fetch } from 'cross-fetch';
import { createClient } from 'graphql-ws';
import WebSocket from 'ws';

import { getInternalApiAddress } from '@app/consts.js';
import { graphqlLogger } from '@app/core/log.js';
import { getters } from '@app/store/index.js';

const getWebsocketWithHeaders = () => {
    return class WebsocketWithOriginHeader extends WebSocket {
        constructor(address, protocols) {
            super(address, protocols, {
                headers: {
                    Origin: '/var/run/unraid-cli.sock',
                    'Content-Type': 'application/json',
                },
            });
        }
    };
};

export const getApiApolloClient = ({ localApiKey }: { localApiKey: string }) => {
    const nginxPort = getters?.emhttp()?.nginx?.httpPort ?? 80;
    graphqlLogger.debug('Internal GraphQL URL: %s', getInternalApiAddress(true, nginxPort));
    const httpLink = new HttpLink({
        uri: getInternalApiAddress(true, nginxPort),
        fetch,
        headers: {
            Origin: '/var/run/unraid-cli.sock',
            'x-api-key': localApiKey,
            'Content-Type': 'application/json',
        },
    });

    // Create the subscription websocket link
    const wsLink = new GraphQLWsLink(
        createClient({
            webSocketImpl: getWebsocketWithHeaders(),
            url: getInternalApiAddress(false, nginxPort),
            connectionParams: () => {
                return { 'x-api-key': localApiKey };
            },
        })
    );

    const splitLink = split(
        ({ query }) => {
            const definition = getMainDefinition(query);
            return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
        },
        wsLink,
        httpLink
    );

    const errorLink = onError(({ networkError }) => {
        if (networkError) {
            graphqlLogger.warn('[GRAPHQL-CLIENT] NETWORK ERROR ENCOUNTERED %o', networkError);
        }
    });

    return new ApolloClient({
        defaultOptions: {
            query: {
                fetchPolicy: 'no-cache',
            },
            mutate: {
                fetchPolicy: 'no-cache',
            },
        },
        cache: new InMemoryCache(),
        link: errorLink.concat(splitLink),
    });
};
