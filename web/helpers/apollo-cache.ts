import { InMemoryCache, type InMemoryCacheConfig } from "@apollo/client/core";

const defaultCacheConfig: InMemoryCacheConfig = {
  typePolicies: {
    Mutation: {
      fields: {
        archiveAll: {
          merge(_, incoming, { cache }) {
            cache.evict({ fieldName: "notifications" });
            // Run garbage collection to clean up evicted references
            cache.gc();
            // Return the incoming data to ensure Apollo knows the result of the mutation
            return incoming;
          },
        },
      },
    },
  },
};

export function createApolloCache(config = defaultCacheConfig) {
  return new InMemoryCache(config);
}
