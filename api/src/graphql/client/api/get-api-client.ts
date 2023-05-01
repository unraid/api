import {
    ApolloClient,
    HttpLink,
    InMemoryCache,
    split,
} from '@apollo/client/core/core.cjs';
import { onError } from '@apollo/client/link/error';
import { getInternalApiAddress } from '@app/consts';
import WebSocket from 'ws';
import { fetch } from 'cross-fetch';
import { getMainDefinition } from '@apollo/client/utilities';
import { graphqlLogger } from '@app/core/log';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getters } from '@app/store/index';

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

export const getApiApolloClient = ({ upcApiKey }: { upcApiKey: string }) => {
    const nginxPort = getters?.emhttp()?.nginx?.httpPort ?? 80;
    graphqlLogger.debug(
        'Internal GraphQL URL: %s',
        getInternalApiAddress(true, nginxPort)
    );
    const httpLink = new HttpLink({
        uri: getInternalApiAddress(true, nginxPort),
        fetch,
        headers: {
            Origin: '/var/run/unraid-cli.sock',
            'x-api-key': upcApiKey,
            'Content-Type': 'application/json',
        },
    });

    // Create the subscription websocket link
    const wsLink = new GraphQLWsLink(
        createClient({
            webSocketImpl: getWebsocketWithHeaders(),
            url: getInternalApiAddress(false, nginxPort),
            connectionParams: () => {
                return { 'x-api-key': upcApiKey };
            },
        })
    );

    const splitLink = split(
        ({ query }) => {
            const definition = getMainDefinition(query);
            return (
                definition.kind === 'OperationDefinition' &&
                definition.operation === 'subscription'
            );
        },
        wsLink,
        httpLink
    );

    const errorLink = onError(({ networkError }) => {
        if (networkError) {
            graphqlLogger.warn(
                '[GRAPHQL-CLIENT] NETWORK ERROR ENCOUNTERED %o',
                networkError
            );
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
