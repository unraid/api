import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client/core/index.js';
import { onError } from '@apollo/client/link/error/index.js';
import { HttpLink } from '@apollo/client/link/http/index.js';

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
     * Get the API address for HTTP requests.
     */
    private getApiAddress(port = this.getNginxPort()) {
        const portOverride = this.getNonSocketPortOverride();
        if (portOverride) {
            return `http://127.0.0.1:${portOverride}/graphql`;
        }
        if (port !== this.PROD_NGINX_PORT) {
            return `http://127.0.0.1:${port}/graphql`;
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
        const httpUri = this.getApiAddress();
        const apiKey = await this.getLocalApiKey();

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
