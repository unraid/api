import { Inject, Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';

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
     * Get the admin API key for CLI operations.
     * First tries to read from /var/run/unraid-api/cli.key, then falls back to AdminKeyService.
     */
    private async getLocalApiKey(): Promise<string> {
        // Try to read ephemeral key from /var/run first
        try {
            const ephemeralKey = await readFile('/var/run/unraid-api/cli.key', 'utf-8');
            if (ephemeralKey) {
                this.logger.debug('Using ephemeral CLI key from runtime directory');
                return ephemeralKey.trim();
            }
        } catch (error) {
            // File doesn't exist or not readable, fall back to service
            this.logger.debug('Ephemeral key file not found, falling back to AdminKeyService');
        }

        // Fall back to AdminKeyService
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

        // Start creating the client with race condition protection
        let creationPromise!: Promise<ApolloClient<NormalizedCacheObject>>;
        // eslint-disable-next-line prefer-const
        creationPromise = (async () => {
            try {
                const client = await this.clientFactory.createClient({
                    getApiKey: () => this.getLocalApiKey(),
                    enableSubscriptions: false, // CLI doesn't need subscriptions
                });

                // awaiting *before* checking this.creatingClient is important!
                // by yielding to the event loop, it ensures
                // `this.creatingClient = creationPromise;` is executed before the next check.

                // This prevents race conditions where the client is assigned to the wrong instance.
                // Only assign client if this creation is still current
                if (this.creatingClient === creationPromise) {
                    this.client = client;
                    this.logger.debug('Created CLI internal GraphQL client with admin privileges');
                }

                return client;
            } finally {
                // Only clear if this creation is still current
                if (this.creatingClient === creationPromise) {
                    this.creatingClient = null;
                }
            }
        })();

        this.creatingClient = creationPromise;
        return await creationPromise;
    }

    public clearClient() {
        // Stop the Apollo client to terminate any active processes
        this.client?.stop();
        this.client = null;
        this.creatingClient = null;
    }
}
