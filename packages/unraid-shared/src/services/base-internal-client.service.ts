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

export interface ApiKeyProvider {
    getOrCreateLocalApiKey(): Promise<string>;
}

export interface InternalClientOptions {
    enableSubscriptions?: boolean;
    origin?: string;
}

/**
 * Base internal GraphQL client service.
 * 
 * This service creates an Apollo client that queries the local API server
 * through IPC, providing access to the same data that external clients would get.
 * 
 * It can be extended by different modules with their own API key providers.
 */
@Injectable()
export abstract class BaseInternalClientService {
    protected readonly logger: Logger;
    protected client: ApolloClient<NormalizedCacheObject> | null = null;
    
    private readonly PROD_NGINX_PORT = 80;

    constructor(
        protected readonly configService: ConfigService,
        protected readonly apiKeyProvider: ApiKeyProvider,
        protected readonly options: InternalClientOptions = {}
    ) {
        this.logger = new Logger(this.constructor.name);
        this.options.origin = this.options.origin ?? '/var/run/unraid-cli.sock';
    }

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
     * Get the API address for the given protocol.
     * @param protocol - The protocol to use.
     * @returns The API address.
     */
    protected getApiAddress(protocol: 'http' | 'ws' = 'http'): string {
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
     * Get the admin API key using the configured ApiKeyProvider.
     * This ensures the key exists and is available for internal operations.
     */
    protected async getLocalApiKey(): Promise<string> {
        try {
            return await this.apiKeyProvider.getOrCreateLocalApiKey();
        } catch (error) {
            this.logger.error('Failed to get API key:', error);
            throw new Error(
                'Unable to get API key for internal client. Ensure the API server is running.'
            );
        }
    }

    protected async createApiClient(): Promise<ApolloClient<NormalizedCacheObject>> {
        const apiKey = await this.getLocalApiKey();
        let httpLink: HttpLink;

        if (this.isRunningOnSocket()) {
            const socketPath = this.getSocketPath();
            this.logger.debug('Internal GraphQL using Unix socket: %s', socketPath);

            const agent = new Agent({
                connect: {
                    socketPath,
                },
            });

            httpLink = new HttpLink({
                uri: 'http://localhost/graphql',
                fetch: ((uri: any, options: any) => {
                    return undiciFetch(uri as string, {
                        ...options,
                        dispatcher: agent,
                    } as any);
                }) as unknown as typeof fetch,
                headers: {
                    Origin: this.options.origin!,
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
            });
        } else {
            const httpUri = this.getApiAddress('http');
            this.logger.debug('Internal GraphQL URL: %s', httpUri);

            httpLink = new HttpLink({
                uri: httpUri,
                fetch,
                headers: {
                    Origin: this.options.origin!,
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
        if (this.options.enableSubscriptions) {
            const wsUri = this.isRunningOnSocket() 
                ? 'ws://localhost/graphql' 
                : this.getApiAddress('ws');

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

        // Simple HTTP-only client
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

    public async getClient(): Promise<ApolloClient<NormalizedCacheObject>> {
        if (this.client) {
            return this.client;
        }
        this.client = await this.createApiClient();
        return this.client;
    }

    public clearClient() {
        this.client?.stop();
        this.client = null;
    }
}