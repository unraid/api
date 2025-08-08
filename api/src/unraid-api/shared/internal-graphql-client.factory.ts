import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client/core/index.js';
import { split } from '@apollo/client/link/core/index.js';
import { onError } from '@apollo/client/link/error/index.js';
import { HttpLink } from '@apollo/client/link/http/index.js';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions/index.js';
import { getMainDefinition } from '@apollo/client/utilities/index.js';
import { createClient } from 'graphql-ws';
import { Agent, fetch as undiciFetch } from 'undici';

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
    private readonly PROD_NGINX_PORT = 80;

    constructor(private readonly configService: ConfigService) {}

    private getNginxPort() {
        return Number(this.configService.get('store.emhttp.nginx.httpPort', this.PROD_NGINX_PORT));
    }

    /**
     * Check if the API is running on a Unix socket
     */
    private isRunningOnSocket() {
        const port = this.configService.get<string>('PORT', '/var/run/unraid-api.sock');
        return port.includes('.sock');
    }

    /**
     * Get the socket path from config
     */
    private getSocketPath() {
        return this.configService.get<string>('PORT', '/var/run/unraid-api.sock');
    }

    /**
     * Get the numeric port if not running on socket
     */
    private getNumericPort() {
        const port = this.configService.get<string>('PORT', '/var/run/unraid-api.sock');
        if (port.includes('.sock')) {
            return undefined;
        }
        return Number(port);
    }

    /**
     * Get the API address for HTTP or WebSocket requests.
     */
    private getApiAddress(protocol: 'http' | 'ws' = 'http') {
        const numericPort = this.getNumericPort();
        if (numericPort) {
            return `${protocol}://127.0.0.1:${numericPort}/graphql`;
        }
        const nginxPort = this.getNginxPort();
        if (nginxPort !== this.PROD_NGINX_PORT) {
            return `${protocol}://127.0.0.1:${nginxPort}/graphql`;
        }
        return `${protocol}://127.0.0.1/graphql`;
    }

    /**
     * Create a GraphQL client with the provided configuration.
     *
     * @param options Configuration options
     * @param options.apiKey Required API key for authentication
     * @param options.enableSubscriptions Optional flag to enable WebSocket subscriptions
     * @param options.origin Optional origin header (defaults to '/var/run/unraid-cli.sock')
     */
    public async createClient(options: {
        apiKey: string;
        enableSubscriptions?: boolean;
        origin?: string;
    }): Promise<ApolloClient<NormalizedCacheObject>> {
        if (!options.apiKey) {
            throw new Error('API key is required for creating a GraphQL client');
        }

        const { apiKey, enableSubscriptions = false, origin = '/var/run/unraid-cli.sock' } = options;
        let httpLink: HttpLink;
        let wsUri: string | undefined;

        if (this.isRunningOnSocket()) {
            const socketPath = this.getSocketPath();
            this.logger.debug('Creating GraphQL client using Unix socket: %s', socketPath);
            if (enableSubscriptions) {
                wsUri = 'ws://localhost/graphql';
            }

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
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
            });
        } else {
            const httpUri = this.getApiAddress('http');
            this.logger.debug('Creating GraphQL client using HTTP: %s', httpUri);
            if (enableSubscriptions) {
                wsUri = this.getApiAddress('ws');
            }

            httpLink = new HttpLink({
                uri: httpUri,
                fetch,
                headers: {
                    Origin: origin,
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
            });
        }

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
                    connectionParams: () => ({ 'x-api-key': apiKey }),
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
                link: errorLink.concat(splitLink),
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
            link: errorLink.concat(httpLink),
        });
    }
}
