import { InMemoryCache, type InMemoryCacheConfig } from '@apollo/client/core/index.js';
import { getNotifications } from '~/components/Notifications/graphql/notification.query';
import { NotificationType, type NotificationOverview } from '~/composables/gql/graphql';
import { NotificationType as NotificationCacheType } from '~/composables/gql/typename';
import { mergeAndDedup } from './merge';

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
          keyArgs: ['filter', ['type', 'importance']],

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
        overview: {
          /**
           * Busts notification cache when new unread notifications are detected.
           *
           * This allows incoming notifications to appear in the sidebar without reloading the page.
           *
           * @param existing - Existing overview data in cache
           * @param incoming - New overview data from server
           * @param context - Apollo context containing cache instance
           * @returns The overview data to be cached
           */
          merge(
            existing: Partial<NotificationOverview> | undefined,
            incoming: Partial<NotificationOverview> | undefined,
            { cache }
          ) {
            const hasNewUnreads =
              isDefined(existing?.unread?.total) &&
              isDefined(incoming?.unread?.total) &&
              existing.unread.total < incoming.unread.total;

            if (hasNewUnreads) {
              cache.evict({ fieldName: 'notifications' });
              cache.gc();
            }
            return incoming;
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
            cache.evict({ fieldName: 'notifications' });
            cache.gc(); // Run garbage collection to prevent orphans & incorrect cache state
            return incoming; // Return the incoming data so Apollo knows the result of the mutation
          },
        },
        archiveNotification: {
          /**
           * Ensures newly archived notifications appear in the archive list without a page reload.
           *
           * When a notification is archived, we need to evict the cached archive list to force a refetch.
           * This ensures the archived notification appears in the correct sorted position.
           *
           * If the archive list is empty, we evict the entire notifications cache since evicting an empty
           * list has no effect. This forces a full refetch of all notification data.
           * Note: This may cause temporary jitter with infinite scroll.
           *
           * This function:
           * 1. Checks if the cache has an archive list. If not, this function is a no-op.
           * 2. If the list has items, evicts just the archive list
           * 3. If it is empty, evicts the entire notifications cache
           * 4. Runs garbage collection to clean up orphaned references
           * 5. Returns the original mutation result
           *
           * @param _ - Existing cache value (unused)
           * @param incoming - Result (i.e. the archived notification) from the server after archiving
           * @param cache - Apollo cache instance
           * @returns The incoming result to be cached
           */
          merge(_, incoming, { cache }) {
            const archiveQuery = cache.readQuery({
              query: getNotifications,
              // @ts-expect-error the cache only uses the filter type; the limit & offset are superfluous.
              variables: { filter: { type: NotificationType.Archive } },
            });
            if (!archiveQuery) return incoming;

            if (archiveQuery.notifications.list.length === 0) {
              cache.evict({ fieldName: 'notifications' });
            } else {
              cache.evict({
                id: archiveQuery.notifications.id,
                fieldName: 'list',
                args: { filter: { type: NotificationType.Archive } },
              });
            }

            cache.gc();
            return incoming;
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
              const id = cache.identify({ id: args.id, __typename: NotificationCacheType });
              cache.evict({ id });
            }
            // Removes references to evicted notification, preventing dangling references
            cache.gc();
            return incoming;
          },
        },
        deleteAllNotifications: {
          merge(_, incoming, { cache }) {
            cache.evict({ fieldName: 'notifications' });
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
