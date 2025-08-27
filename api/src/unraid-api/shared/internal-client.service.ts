import { Inject, Injectable, Logger } from '@nestjs/common';

import type { CanonicalInternalClientService, InternalGraphQLClientFactory } from '@unraid/shared';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client/core/index.js';
import { INTERNAL_CLIENT_FACTORY_TOKEN } from '@unraid/shared';

import { LocalSessionService } from '@app/unraid-api/auth/local-session.service.js';

/**
 * Canonical internal GraphQL client service.
 *
 * This service provides a GraphQL client for internal use with local session authentication.
 * It replaces the need for separate internal client implementations in different packages.
 */
@Injectable()
export class InternalClientService implements CanonicalInternalClientService {
    private readonly logger = new Logger(InternalClientService.name);
    private client: ApolloClient<NormalizedCacheObject> | null = null;
    private clientCreationPromise: Promise<ApolloClient<NormalizedCacheObject>> | null = null;

    constructor(
        @Inject(INTERNAL_CLIENT_FACTORY_TOKEN)
        private readonly clientFactory: InternalGraphQLClientFactory,
        private readonly localSessionService: LocalSessionService
    ) {}

    /**
     * Get GraphQL client with local session authentication.
     * If no client exists, one will be created with the given options.
     * Otherwise, the options are ignored, and the existing client is returned.
     *
     * @param options - Options for creating the client
     * @param options.enableSubscriptions - Whether to enable WebSocket subscriptions
     * @param options.origin - The origin of the client
     * @returns The GraphQL client
     */
    public async getClient(options?: {
        enableSubscriptions?: boolean;
        origin?: string;
    }): Promise<ApolloClient<NormalizedCacheObject>> {
        // If client already exists, return it
        if (this.client) {
            return this.client;
        }

        // If client creation is in progress, wait for it
        if (this.clientCreationPromise) {
            return this.clientCreationPromise;
        }

        // Start client creation and store the promise
        const creationPromise = this.createClient(options);
        this.clientCreationPromise = creationPromise;

        try {
            // Wait for client creation to complete
            const client = await creationPromise;
            // Only set the client if this is still the current creation promise
            if (this.clientCreationPromise === creationPromise) {
                this.client = client;
            }
            return client;
        } finally {
            // Clear the in-flight promise only if it's still ours
            if (this.clientCreationPromise === creationPromise) {
                this.clientCreationPromise = null;
            }
        }
    }

    private async createClient(options?: {
        enableSubscriptions?: boolean;
        origin?: string;
    }): Promise<ApolloClient<NormalizedCacheObject>> {
        const { enableSubscriptions = true, origin } = options || {};

        // Create client with local session authentication
        const client = await this.clientFactory.createClient({
            getLocalSession: () => this.localSessionService.getLocalSession(),
            enableSubscriptions,
            origin,
        });

        this.logger.debug('Created canonical internal GraphQL client with local session authentication');
        return client;
    }

    public clearClient() {
        // Stop the Apollo client to terminate any active processes
        this.client?.stop();
        this.client = null;
        this.clientCreationPromise = null;
    }
}
