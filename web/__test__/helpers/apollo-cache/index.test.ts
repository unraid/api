import { provideApolloClient } from '@vue/apollo-composable';

import { ApolloClient, ApolloLink, Observable } from '@apollo/client/core';
import { createApolloCache } from '~/helpers/apollo-cache';
import { GraphQLError } from 'graphql';
import { describe, expect, it } from 'vitest';

import {
  archiveNotification,
  getNotifications,
  NOTIFICATION_FRAGMENT,
  notificationsOverview,
} from '~/components/Notifications/graphql/notification.query';
import { useArchiveAllNotifications } from '~/composables/api/use-notifications';
import { makeFragmentData } from '~/composables/gql/fragment-masking';
import { NotificationImportance, NotificationType } from '~/composables/gql/graphql';

const archivedNotification = makeFragmentData(
  {
    __typename: 'Notification',
    id: 'n1',
    title: 'Unraid Status',
    subject: 'Mover finished',
    description: 'Mover finished',
    importance: NotificationImportance.INFO,
    link: null,
    type: NotificationType.ARCHIVE,
    timestamp: '2026-10-31T19:06:09.000Z',
    formattedTimestamp: '31-10-2026 19:06',
  },
  NOTIFICATION_FRAGMENT
);

const counts = (total: number) => ({
  __typename: 'NotificationCounts' as const,
  info: total,
  warning: 0,
  alert: 0,
  total,
});

const overview = (unread: number, archive: number) => ({
  notifications: {
    __typename: 'Notifications' as const,
    id: 'notifications',
    overview: {
      __typename: 'NotificationOverview' as const,
      unread: counts(unread),
      archive: { __typename: 'NotificationCounts' as const, total: archive },
    },
  },
});

const writeArchiveResult = (cache: ReturnType<typeof createApolloCache>) =>
  cache.write({
    dataId: 'ROOT_MUTATION',
    query: archiveNotification,
    variables: { id: 'n1' },
    result: { archiveNotification: archivedNotification },
  });

const readOverview = (cache: ReturnType<typeof createApolloCache>) =>
  cache.readQuery({ query: notificationsOverview })?.notifications.overview;

describe('Archive All cache invalidation', () => {
  it('refetches the unread and archived lists after a partially completed archive', async () => {
    const cache = createApolloCache();
    cache.writeQuery({ query: notificationsOverview, data: overview(1, 0) });
    let archiveAttempted = false;
    const link = new ApolloLink(
      (operation) =>
        new Observable((observer) => {
          if (operation.operationName === 'ArchiveAllNotifications') {
            archiveAttempted = true;
            cache.writeQuery({ query: notificationsOverview, data: overview(0, 1) });
            observer.next({ data: null, errors: [new GraphQLError('Partial completion')] });
          } else {
            const archive = operation.variables.filter.type === NotificationType.ARCHIVE;
            const notification = archive
              ? archivedNotification
              : { ...archivedNotification, type: NotificationType.UNREAD };
            observer.next({
              data: {
                notifications: {
                  __typename: 'Notifications',
                  id: 'notifications',
                  list: archive === archiveAttempted ? [notification] : [],
                },
              },
            });
          }
          observer.complete();
        })
    );
    const client = new ApolloClient({ cache, link });
    const { mutate } = provideApolloClient(client)(useArchiveAllNotifications);
    const watchList = (type: NotificationType) => {
      const list: { total?: number } = {};
      const subscription = client
        .watchQuery({ query: getNotifications, variables: { filter: { type, limit: 15, offset: 0 } } })
        .subscribe(({ data }) => {
          list.total = data.notifications?.list.length;
        });
      return { list, subscription };
    };
    const unread = watchList(NotificationType.UNREAD);
    const archive = watchList(NotificationType.ARCHIVE);

    try {
      await expect.poll(() => [unread.list.total, archive.list.total]).toEqual([1, 0]);

      await expect(mutate()).rejects.toThrow('Partial completion');

      await expect.poll(() => [unread.list.total, archive.list.total]).toEqual([0, 1]);
    } finally {
      unread.subscription.unsubscribe();
      archive.subscription.unsubscribe();
      client.stop();
    }
  });
});

describe('archiveNotification cache policy', () => {
  it('keeps the server overview when the subscription arrives before the mutation result', () => {
    const cache = createApolloCache();
    cache.writeQuery({ query: notificationsOverview, data: overview(1, 0) });

    cache.writeQuery({ query: notificationsOverview, data: overview(0, 1) });
    writeArchiveResult(cache);

    expect(readOverview(cache)?.unread.total).toBe(0);
    expect(readOverview(cache)?.archive.total).toBe(1);
  });

  it('keeps the server overview when the mutation result arrives first', () => {
    const cache = createApolloCache();
    cache.writeQuery({ query: notificationsOverview, data: overview(1, 0) });

    writeArchiveResult(cache);
    cache.writeQuery({ query: notificationsOverview, data: overview(0, 1) });

    expect(readOverview(cache)?.unread.total).toBe(0);
    expect(readOverview(cache)?.archive.total).toBe(1);
  });
});
