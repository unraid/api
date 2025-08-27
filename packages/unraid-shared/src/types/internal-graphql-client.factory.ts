import type { ApolloClient, NormalizedCacheObject } from '@apollo/client/core/index.js';

/**
 * Interface for the internal GraphQL client factory.
 * The actual implementation is provided by the API package through dependency injection.
 */
export interface InternalGraphQLClientFactory {
    createClient(options: {
        getApiKey?: () => Promise<string>;
        getCookieAuth?: () => Promise<{ sessionId: string; csrfToken: string } | null>;
        getLocalSession?: () => Promise<string | null>;
        enableSubscriptions?: boolean;
        origin?: string;
    }): Promise<ApolloClient<NormalizedCacheObject>>;
}