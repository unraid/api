import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client/core/index.js';
import { INTERNAL_CLIENT_SERVICE_TOKEN } from '@unraid/shared/tokens.js';

import { ConnectApiKeyService } from '../authn/connect-api-key.service.js';

// Type for the injected factory
interface InternalGraphQLClientFactory {
    createClient(options: {
        apiKey: string;
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

    constructor(
        @Inject(INTERNAL_CLIENT_SERVICE_TOKEN)
        private readonly clientFactory: InternalGraphQLClientFactory,
        private readonly apiKeyService: ConnectApiKeyService
    ) {}

    public async getClient(): Promise<ApolloClient<NormalizedCacheObject>> {
        if (this.client) {
            return this.client;
        }
        
        // Get Connect's API key
        const localApiKey = await this.apiKeyService.getOrCreateLocalApiKey();
        
        // Create a client with Connect's API key and subscriptions enabled
        const client = await this.clientFactory.createClient({
            apiKey: localApiKey,
            enableSubscriptions: true
        });
        this.client = client;
        
        this.logger.debug('Created Connect internal GraphQL client with subscriptions enabled');
        return client;
    }

    public clearClient() {
        this.client?.stop();
        this.client = null;
    }
}
