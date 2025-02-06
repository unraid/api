/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TypedDocumentNode } from '@apollo/client';
import { useQuery } from '@vue/apollo-composable';
import { useStorage } from '@vueuse/core';
import {
  getNotifications,
  NOTIFICATION_FRAGMENT,
} from '~/components/Notifications/graphql/notification.query';
import { useFragment } from '~/composables/gql/fragment-masking';
import { NotificationType } from '../gql/graphql';

/** whether user has viewed their notifications */
export function useHaveSeenNotifications() {
  // time '0' is shorthand for Jan 1 2000, which is good enough.
  return {
    latestSeenTimestamp: useStorage('latest-seen-notification-timestamp', '0'),
    haveSeenNotifications: useStorage('have-seen-notifications', false),
  };
}

type ExtractVariables<T> = T extends TypedDocumentNode<unknown, infer U> ? U : never;
type Variables = ExtractVariables<typeof getNotifications>;

type Options = Parameters<typeof useQuery<typeof getNotifications, Variables>>[2];
type Vars = Parameters<typeof useQuery<typeof getNotifications, Variables>>[1];

export const useNotifications = (variables: Vars, options?: Options) => {
  const query = useQuery(getNotifications, variables, options ?? {});
  const notifications = computed(() => {
    if (!query.result.value?.notifications.list) return [];
    return useFragment(NOTIFICATION_FRAGMENT, query.result.value?.notifications.list);
  });
  return {
    notificationsQuery: query,
    notifications,
  };
};

export function trackLatestSeenNotification() {
  const { haveSeenNotifications, latestSeenTimestamp } = useHaveSeenNotifications();

  const { result: latestNotifications } = useQuery(getNotifications, () => ({
    filter: {
      offset: 0,
      limit: 1,
      type: NotificationType.Unread,
    },
  }));

  const latestNotification = computed(() => {
    const list = latestNotifications.value?.notifications.list;
    if (!list) return;
    const [notification] = useFragment(NOTIFICATION_FRAGMENT, list);
    return notification;
  });

  const latestNotificationTimestamp = ref<string | null>();
  watchOnce(latestNotification, () => {
    latestNotificationTimestamp.value = latestNotification.value?.timestamp;
    console.log('notif HHH', latestNotificationTimestamp.value);
  });

  const isBeforeLastSeen = (timestamp?: string | null) =>
    new Date(timestamp ?? '0') <= new Date(latestSeenTimestamp.value);

  watchEffect(() => {
    console.log('running', latestNotificationTimestamp.value, latestSeenTimestamp.value);
    if (!latestNotificationTimestamp.value) {
        haveSeenNotifications.value = false;
        return;
    }
    console.log('setting', isBeforeLastSeen(latestNotificationTimestamp.value));
    haveSeenNotifications.value = isBeforeLastSeen(latestNotificationTimestamp.value);
  });

  return {
    latestNotification,
    latestNotificationTimestamp,
    haveSeenNotifications,
    latestSeenTimestamp,
    isBeforeLastSeen,
  };
}
