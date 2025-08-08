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

import { ConnectApiKeyService } from '../authn/connect-api-key.service.js';

/**
 * Internal GraphQL "RPC" client.
 *
 * Unfortunately, there's no simple way to make perform internal gql operations that go through
 * all of the validations, filters, authorization, etc. in our setup.
 *
 * The simplest and most maintainable solution, unfortunately, is to maintain an actual graphql client
 * that queries our own graphql server.
 *
 * This service handles the lifecycle and construction of that client.
 */
@Injectable()
export class InternalClientService {
    constructor(
        private readonly configService: ConfigService,
        private readonly apiKeyService: ConnectApiKeyService
    ) {}

    private PROD_NGINX_PORT = 80;
    private logger = new Logger(InternalClientService.name);
    private client: ApolloClient<NormalizedCacheObject> | null = null;

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
    private getApiAddress(protocol: 'http' | 'ws') {
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

    private createApiClient({ apiKey }: { apiKey: string }) {
        let httpLink: HttpLink;
        let wsUri: string;

        if (this.isRunningOnSocket()) {
            const socketPath = this.getSocketPath();
            this.logger.debug('Internal GraphQL using Unix socket: %s', socketPath);
            wsUri = 'ws://localhost/graphql';

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
                    Origin: '/var/run/unraid-cli.sock',
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
            });
        } else {
            const httpUri = this.getApiAddress('http');
            wsUri = this.getApiAddress('ws');
            this.logger.debug('Internal GraphQL URL: %s', httpUri);

            httpLink = new HttpLink({
                uri: httpUri,
                fetch,
                headers: {
                    Origin: '/var/run/unraid-cli.sock',
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
            });
        }

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
                    definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
                );
            },
            wsLink,
            httpLink
        );

        const errorLink = onError(({ networkError }) => {
            if (networkError) {
                this.logger.warn('[GRAPHQL-CLIENT] NETWORK ERROR ENCOUNTERED %o', networkError);
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
    }

    public async getClient() {
        if (this.client) {
            return this.client;
        }
        const localApiKey = await this.apiKeyService.getOrCreateLocalApiKey();
        this.client = this.createApiClient({ apiKey: localApiKey });
        return this.client;
    }

    public clearClient() {
        this.client?.stop();
        this.client = null;
    }
}
