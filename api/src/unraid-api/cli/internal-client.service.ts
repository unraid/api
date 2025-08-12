import { Inject, Injectable, Logger } from '@nestjs/common';

import type { InternalGraphQLClientFactory } from '@unraid/shared';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client/core/index.js';
import { INTERNAL_CLIENT_SERVICE_TOKEN } from '@unraid/shared';

import { AdminKeyService } from '@app/unraid-api/cli/admin-key.service.js';

/**
 * Internal GraphQL client for CLI commands.
 *
 * This service creates an Apollo client that queries the local API server
 * with admin privileges for CLI operations.
 */
@Injectable()
export class CliInternalClientService {
    private readonly logger = new Logger(CliInternalClientService.name);
    private client: ApolloClient<NormalizedCacheObject> | null = null;
    private creatingClient: Promise<ApolloClient<NormalizedCacheObject>> | null = null;

    constructor(
        @Inject(INTERNAL_CLIENT_SERVICE_TOKEN)
        private readonly clientFactory: InternalGraphQLClientFactory,
        private readonly adminKeyService: AdminKeyService
    ) {}

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

    /**
     * Get the default CLI client with admin API key.
     * This is for CLI commands that need admin access.
     */
    public async getClient(): Promise<ApolloClient<NormalizedCacheObject>> {
        // If client already exists, return it
        if (this.client) {
            return this.client;
        }

        // If another call is already creating the client, wait for it
        if (this.creatingClient) {
            return await this.creatingClient;
        }

        // Start creating the client
        this.creatingClient = (async () => {
            try {
                const client = await this.clientFactory.createClient({
                    getApiKey: () => this.getLocalApiKey(),
                    enableSubscriptions: false, // CLI doesn't need subscriptions
                });

                this.client = client;
                this.logger.debug('Created CLI internal GraphQL client with admin privileges');
                return client;
            } finally {
                // Clear the creating promise on both success and failure
                this.creatingClient = null;
            }
        })();

        return await this.creatingClient;
    }

    public clearClient() {
        // Stop the Apollo client to terminate any active processes
        this.client?.stop();
        this.client = null;
        this.creatingClient = null;
    }
}
