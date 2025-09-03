import type { ApolloClient, NormalizedCacheObject } from '@apollo/client/core/index.js';

export interface CanonicalInternalClientService {
    /**
     * Get GraphQL client with cookie authentication.
     * This is the canonical internal client for the application.
     */
    getClient(options?: { enableSubscriptions?: boolean; origin?: string }): Promise<ApolloClient<NormalizedCacheObject>>;

    /**
     * Clear the current client and force recreation on next use.
     */
    clearClient(): void;
}
