import { createApolloCache } from '~/helpers/apollo-cache';
import { describe, expect, it } from 'vitest';

import {
  archiveNotification,
  NOTIFICATION_FRAGMENT,
  notificationsOverview,
} from '~/components/Notifications/graphql/notification.query';
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
