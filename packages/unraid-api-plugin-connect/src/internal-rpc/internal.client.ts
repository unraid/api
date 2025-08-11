import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client/core/index.js';
import { INTERNAL_CLIENT_SERVICE_TOKEN } from '@unraid/shared/tokens.js';

import { ConnectApiKeyService } from '../authn/connect-api-key.service.js';

// Type for the injected factory
interface InternalGraphQLClientFactory {
    createClient(options: {
        getApiKey: () => Promise<string>;
        enableSubscriptions?: boolean;
        origin?: string;
    }): Promise<ApolloClient<NormalizedCacheObject>>;
}

/**
 * Connect-specific internal GraphQL client.
 * 
 * This uses the shared GraphQL client factory with Connect's API key
 * and enables subscriptions for real-time updates.
 */
@Injectable()
export class InternalClientService {
    private readonly logger = new Logger(InternalClientService.name);
    private client: ApolloClient<NormalizedCacheObject> | null = null;
    private clientCreationPromise: Promise<ApolloClient<NormalizedCacheObject>> | null = null;

    constructor(
        @Inject(INTERNAL_CLIENT_SERVICE_TOKEN)
        private readonly clientFactory: InternalGraphQLClientFactory,
        private readonly apiKeyService: ConnectApiKeyService
    ) {}

    public async getClient(): Promise<ApolloClient<NormalizedCacheObject>> {
        // If client already exists, return it
        if (this.client) {
            return this.client;
        }
        
        // If client creation is in progress, wait for it
        if (this.clientCreationPromise) {
            return this.clientCreationPromise;
        }
        
        // Start client creation and store the promise
        const creationPromise = this.createClient();
        this.clientCreationPromise = creationPromise;
        
        try {
            // Wait for client creation to complete
            const client = await creationPromise;
            // Only set the client if this is still the current creation promise
            // (if clearClient was called, clientCreationPromise would be null)
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

    private async createClient(): Promise<ApolloClient<NormalizedCacheObject>> {
        // Create a client with a function to get Connect's API key dynamically
        const client = await this.clientFactory.createClient({
            getApiKey: () => this.apiKeyService.getOrCreateLocalApiKey(),
            enableSubscriptions: true
        });
        
        this.logger.debug('Created Connect internal GraphQL client with subscriptions enabled');
        return client;
    }

    public clearClient() {
        // Stop the Apollo client to terminate any active processes
        this.client?.stop();
        this.client = null;
        this.clientCreationPromise = null;
    }
}
