import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client/core/index.js';
import { COOKIE_SERVICE_TOKEN, INTERNAL_CLIENT_SERVICE_TOKEN, type InternalGraphQLClientFactory } from '@unraid/shared';

/**
 * Connect-specific internal GraphQL client.
 * 
 * This uses the shared GraphQL client factory with cookie-based authentication
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
        @Inject(COOKIE_SERVICE_TOKEN)
        private readonly cookieService: any,
        private readonly configService: ConfigService
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
        // Create a client with cookie-based authentication
        const client = await this.clientFactory.createClient({
            getCookieAuth: async () => {
                const sessionId = await this.cookieService.getActiveSession();
                if (!sessionId) {
                    return null;
                }
                
                const csrfToken = this.configService.get<string>('store.emhttp.var.csrfToken');
                if (!csrfToken) {
                    throw new Error('CSRF token not found in configuration');
                }
                
                return { sessionId, csrfToken };
            },
            enableSubscriptions: true
        });
        
        this.logger.debug('Created Connect internal GraphQL client with cookie auth and subscriptions enabled');
        return client;
    }

    public clearClient() {
        // Stop the Apollo client to terminate any active processes
        this.client?.stop();
        this.client = null;
        this.clientCreationPromise = null;
    }
}
