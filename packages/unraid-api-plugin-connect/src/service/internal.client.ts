import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client/core/index.js';
import { split } from '@apollo/client/link/core/index.js';
import { onError } from '@apollo/client/link/error/index.js';
import { HttpLink } from '@apollo/client/link/http/index.js';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions/index.js';
import { getMainDefinition } from '@apollo/client/utilities/index.js';
import { createClient } from 'graphql-ws';
import { WebSocket } from 'ws';

import { MyServersConfig } from '../model/connect-config.model.js';
import { MothershipConnectionService } from './connection.service.js';

@Injectable()
export class InternalClientService {
    constructor(
        private readonly configService: ConfigService,
        private readonly connectionService: MothershipConnectionService
    ) {}

    private PROD_NGINX_PORT = 80;
    private logger = new Logger(InternalClientService.name);
    private client: ApolloClient<NormalizedCacheObject> | null = null;

    private getNginxPort() {
        return Number(this.configService.get('store.emhttp.nginx.httpPort', this.PROD_NGINX_PORT));
    }

    /**
     * Get the port override from the environment variable PORT. e.g. during development.
     * If the port is a socket port, return undefined.
     */
    private getNonSocketPortOverride() {
        const port = this.configService.get<string | number | undefined>('PORT');
        if (!port || port.toString().includes('.sock')) {
            return undefined;
        }
        return Number(port);
    }

    /**
     * Get the API address for the given protocol.
     * @param protocol - The protocol to use.
     * @param port - The port to use.
     * @returns The API address.
     */
    private getApiAddress(protocol: 'http' | 'ws', port = this.getNginxPort()) {
        const portOverride = this.getNonSocketPortOverride();
        if (portOverride) {
            return `${protocol}://127.0.0.1:${portOverride}/graphql`;
        }
        if (port !== this.PROD_NGINX_PORT) {
            return `${protocol}://127.0.0.1:${port}/graphql`;
        }
        return `${protocol}://127.0.0.1/graphql`;
    }

    /**
     * Create a WebSocket class with Mothership headers
     */
    private getWebsocketWithMothershipHeaders() {
        const getHeaders = () => this.connectionService.getMothershipWebsocketHeaders();
        return class WebsocketWithMothershipHeaders extends WebSocket {
            constructor(address: string | URL, protocols?: string | string[]) {
                super(address, protocols, {
                    headers: getHeaders(),
                });
            }
        };
    }

    private createApiClient({ apiKey }: { apiKey: string }) {
        const httpUri = this.getApiAddress('http');
        const wsUri = this.getApiAddress('ws');
        this.logger.debug('Internal GraphQL URL: %s', httpUri);

        const httpLink = new HttpLink({
            uri: httpUri,
            fetch,
            headers: {
                Origin: '/var/run/unraid-cli.sock',
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
        });

        const wsLink = new GraphQLWsLink(
            createClient({
                webSocketImpl: this.getWebsocketWithMothershipHeaders(),
                url: wsUri,
                connectionParams: () => {
                    return { 'x-api-key': apiKey };
                },
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

    public getClient() {
        if (this.client) {
            return this.client;
        }
        const config = this.configService.getOrThrow<MyServersConfig>('connect.config');
        this.client = this.createApiClient({ apiKey: config.localApiKey });
        return this.client;
    }

    public clearClient() {
        this.client?.stop();
        this.client = null;
    }
}
