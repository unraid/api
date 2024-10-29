import { InMemoryCache, type InMemoryCacheConfig } from "@apollo/client/core";
import { mergeAndDedup } from "./merge";

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
           * Merges incoming data into the correct offset position.
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
            return mergeAndDedup(existing, incoming, (item) => item.__ref, {
              offset,
            });
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
            cache.gc(); // Run garbage collection to prevent orphans & incorrect cache state
            return incoming; // Return the incoming data so Apollo knows the result of the mutation
          },
        },
        deleteNotification: {
          /**
           * Ensures that a deleted notification is removed from the cache +
           * any cached items that reference it
           *
           * @param _ - Unused parameter representing the existing cache value.
           * @param incoming - The result from the server after the mutation.
           * @param cache - The Apollo cache instance.
           * @param args - Arguments passed to the mutation, expected to contain the `id` of the notification to evict.
           * @returns The incoming result to be cached.
           */
          merge(_, incoming, { cache, args }) {
            if (args?.id) {
              // The magic 'Notification:' prefix comes from inspecting the apollo cache
              // I think it comes from the __typename when apollo caches an object (by default)
              cache.evict({ id: `Notification:${args.id}` });
            }
            // Removes references to evicted notification, preventing dangling references
            cache.gc();
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
