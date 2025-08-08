import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client/core/index.js';
import { onError } from '@apollo/client/link/error/index.js';
import { HttpLink } from '@apollo/client/link/http/index.js';
import { Agent, fetch as undiciFetch } from 'undici';

import { AdminKeyService } from '@app/unraid-api/cli/admin-key.service.js';

/**
 * Internal GraphQL client for CLI commands.
 *
 * This service creates an Apollo client that queries the local API server
 * through IPC, providing access to the same data that external clients would get
 * but without needing to parse config files directly.
 */
@Injectable()
export class CliInternalClientService {
    private readonly logger = new Logger(CliInternalClientService.name);
    private client: ApolloClient<NormalizedCacheObject> | null = null;

    constructor(
        private readonly configService: ConfigService,
        private readonly adminKeyService: AdminKeyService
    ) {}

    private PROD_NGINX_PORT = 80;

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
     * Get the API address for HTTP requests.
     */
    private getApiAddress() {
        const numericPort = this.getNumericPort();
        if (numericPort) {
            return `http://127.0.0.1:${numericPort}/graphql`;
        }
        const nginxPort = this.getNginxPort();
        if (nginxPort !== this.PROD_NGINX_PORT) {
            return `http://127.0.0.1:${nginxPort}/graphql`;
        }
        return `http://127.0.0.1/graphql`;
    }

    /**
     * Get the admin API key using the AdminKeyService.
     * This ensures the key exists and is available for CLI operations.
     */
    private async getLocalApiKey(): Promise<string> {
        try {
            return await this.adminKeyService.getOrCreateLocalAdminKey();
        } catch (error) {
            this.logger.error('Failed to get admin API key:', error);
            throw new Error(
                'Unable to get admin API key for internal client. Ensure the API server is running.'
            );
        }
    }

    private async createApiClient(): Promise<ApolloClient<NormalizedCacheObject>> {
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
                fetch: (uri, options) => {
                    return undiciFetch(
                        uri as string,
                        {
                            ...options,
                            dispatcher: agent,
                        } as any
                    );
                },
                headers: {
                    Origin: '/var/run/unraid-cli.sock',
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
            });
        } else {
            const httpUri = this.getApiAddress();
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
