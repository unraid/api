import { ApolloClient, NormalizedCacheObject } from '@apollo/client/core/index.js';

/**
 * Interface for the internal GraphQL client factory.
 * The actual implementation is provided by the API package through dependency injection.
 */
export interface InternalGraphQLClientFactory {
    createClient(options: {
        getApiKey: () => Promise<string>;
        enableSubscriptions?: boolean;
        origin?: string;
    }): Promise<ApolloClient<NormalizedCacheObject>>;
}