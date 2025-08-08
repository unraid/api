import { Injectable, Logger } from '@nestjs/common';

import { ApolloClient, NormalizedCacheObject } from '@apollo/client/core/index.js';

import { AdminKeyService } from '@app/unraid-api/cli/admin-key.service.js';
import { InternalGraphQLClientFactory } from '@app/unraid-api/shared/internal-graphql-client.factory.js';

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

    constructor(
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
        if (this.client) {
            return this.client;
        }

        const apiKey = await this.getLocalApiKey();
        this.client = await this.clientFactory.createClient({
            apiKey,
            enableSubscriptions: false, // CLI doesn't need subscriptions
        });

        this.logger.debug('Created CLI internal GraphQL client with admin privileges');
        return this.client;
    }

    public clearClient() {
        // Stop the Apollo client to terminate any active processes
        this.client?.stop();
        this.client = null;
    }
}
