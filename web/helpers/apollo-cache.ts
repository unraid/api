import { InMemoryCache, type InMemoryCacheConfig } from "@apollo/client/core";

/**------------------------------------------------------------------------
 * !                    Understanding Cache Type Policies
 *
 *   The 'type' in type policies is a discriminated union of all graphql
 * types recognized by Apollo (which defaults to discriminating on the
 * __typename field).
 *
 * This means the depth or hiearchy of a field/type is irrelevant; the policy
 * will always be [ParentType]: TypePolicy (where you can define the behavior
 * of the field you actually care about).
 *
 * "Top-level" types are Query, Mutation, and Subscription. This is where your
 * your top-level operations are defined. If you want to modify a sub-field or
 * sub-operation, you need to look for its containing type.
 *
 * e.g. Query -> Notifications -> list
 *
 * The policy to modify `list`'s behavior will live in the policy for
 * `Notifications`.
 *------------------------------------------------------------------------**/

const defaultCacheConfig: InMemoryCacheConfig = {
  typePolicies: {
    Notifications: {
      fields: {
        list: {
          /**----------------------------------------------
           * ?               Key Args Syntax
           *
           *  the sub-list in this context means "fields from the preceding key"
           *
           * i.e. this means [filter.type, filter.importance],
           * not [filter, type, importance]
           *---------------------------------------------**/
          keyArgs: ["filter", ["type", "importance"]],

          /**
           * Merges incoming data into the correct offset position. copied from
           * [Apollo Docs](https://www.apollographql.com/docs/react/pagination/core-api#improving-the-merge-function).
           *
           * This lets paginated results live as a single list in the cache,
           * which simplifies our client code.
           *
           * @param existing
           * @param incoming
           * @param context
           * @returns the value to be cached
           */
          merge(existing = [], incoming, { args }) {
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
          /**
           * This clears the notifications cache when `archiveAll` is called to
           * ensure that notification queries are invalidated, refetched,
           * and in the correct state & sorting order after this operation.
           *
           * @param _ existing value in cache (irrelevant to this operation)
           * @param incoming result from the server
           * @param apolloContext contains the cache object
           * @returns the value to cache for this operation
           */
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
