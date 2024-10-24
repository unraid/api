import { InMemoryCache, type InMemoryCacheConfig } from "@apollo/client/core";

const defaultCacheConfig: InMemoryCacheConfig = {
  typePolicies: {
    Notifications: {
      fields: {
        list: {
          keyArgs: ["filter", ["type", "importance"]],
          merge(existing = [], incoming, { args }) {
            // copied from https://www.apollographql.com/docs/react/pagination/core-api#improving-the-merge-function
            const offset = args?.filter?.offset ?? 0;
            const merged = existing.slice(0);

            for (let i = 0; i < incoming.length; ++i) {
              merged[offset + i] = incoming[i];
            }
            return merged;
          },
        },
      },
    },
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
