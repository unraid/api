import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client/core/index.js';
import { setContext } from '@apollo/client/link/context/index.js';
import { split } from '@apollo/client/link/core/index.js';
import { onError } from '@apollo/client/link/error/index.js';
import { HttpLink } from '@apollo/client/link/http/index.js';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions/index.js';
import { getMainDefinition } from '@apollo/client/utilities/index.js';
import { SocketConfigService } from '@unraid/shared';
import { createClient } from 'graphql-ws';
import { Agent, fetch as undiciFetch } from 'undici';
import WebSocket from 'ws';

/**
 * Factory service for creating internal GraphQL clients.
 *
 * This service provides a way for any module to create its own GraphQL client
 * with its own API key and configuration. It does NOT provide any default
 * API key access - each consumer must provide their own.
 *
 * This ensures proper security isolation between different modules.
 */
@Injectable()
export class InternalGraphQLClientFactory {
    private readonly logger = new Logger(InternalGraphQLClientFactory.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly socketConfig: SocketConfigService
    ) {}

    /**
     * Create a GraphQL client with the provided configuration.
     *
     * @param options Configuration options
     * @param options.getApiKey Function to get the current API key
     * @param options.enableSubscriptions Optional flag to enable WebSocket subscriptions
     * @param options.origin Optional origin header (defaults to 'http://localhost')
     */
    public async createClient(options: {
        getApiKey: () => Promise<string>;
        enableSubscriptions?: boolean;
        origin?: string;
    }): Promise<ApolloClient<NormalizedCacheObject>> {
        if (!options.getApiKey) {
            throw new Error('getApiKey function is required for creating a GraphQL client');
        }

        const { getApiKey, enableSubscriptions = false, origin = 'http://localhost' } = options;
        let httpLink: HttpLink;

        // Get WebSocket URI if subscriptions are enabled
        const wsUri = this.socketConfig.getWebSocketUri(enableSubscriptions);
        if (enableSubscriptions && wsUri) {
            this.logger.debug('WebSocket subscriptions enabled: %s', wsUri);
        }

        if (this.socketConfig.isRunningOnSocket()) {
            const socketPath = this.socketConfig.getSocketPath();
            this.logger.debug('Creating GraphQL client using Unix socket: %s', socketPath);

            const agent = new Agent({
                connect: {
                    socketPath,
                },
            });

            httpLink = new HttpLink({
                uri: 'http://localhost/graphql',
                fetch: ((uri: any, options: any) => {
                    return undiciFetch(
                        uri as string,
                        {
                            ...options,
                            dispatcher: agent,
                        } as any
                    );
                }) as unknown as typeof fetch,
                headers: {
                    Origin: origin,
                    'Content-Type': 'application/json',
                },
            });
        } else {
            const httpUri = this.socketConfig.getApiAddress('http');
            this.logger.debug('Creating GraphQL client using HTTP: %s', httpUri);

            httpLink = new HttpLink({
                uri: httpUri,
                fetch,
                headers: {
                    Origin: origin,
                    'Content-Type': 'application/json',
                },
            });
        }

        // Create auth link that dynamically fetches the API key for each request
        const authLink = setContext(async (_, { headers }) => {
            const apiKey = await getApiKey();
            return {
                headers: {
                    ...headers,
                    'x-api-key': apiKey,
                },
            };
        });

        const errorLink = onError(({ networkError }) => {
            if (networkError) {
                this.logger.warn('[GRAPHQL-CLIENT] NETWORK ERROR ENCOUNTERED %o', networkError);
            }
        });

        // If subscriptions are enabled, set up WebSocket link
        if (enableSubscriptions && wsUri) {
            const wsLink = new GraphQLWsLink(
                createClient({
                    url: wsUri,
                    connectionParams: async () => {
                        const apiKey = await getApiKey();
                        return { 'x-api-key': apiKey };
                    },
                    webSocketImpl: WebSocket,
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
                link: errorLink.concat(authLink).concat(splitLink),
            });
        }

        // HTTP-only client
        return new ApolloClient({
            defaultOptions: {
                query: {
                    fetchPolicy: 'no-cache',
                },
            },
            cache: new InMemoryCache(),
            link: errorLink.concat(authLink).concat(httpLink),
        });
    }
}
