/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const haveSeenNotificationsStorage = useStorage<boolean>('have-seen-notifications', null);
  const haveSeenNotificationsRef = ref<boolean>();
//   const haveSeenNotifications = computed(() => {
//     console.log('computing haveSeenNotificationsStorage.value', haveSeenNotificationsStorage.value, localStorage.getItem('have-seen-notifications'));
//     return (
//       haveSeenNotificationsStorage.value || localStorage.getItem('have-seen-notifications') === 'true'
//     );
//   });
  watchImmediate(haveSeenNotificationsStorage, () => {
    console.log('watching haveSeenNotificationsStorage.value', haveSeenNotificationsStorage.value, localStorage.getItem('have-seen-notifications'));
    haveSeenNotificationsRef.value = haveSeenNotificationsStorage.value || localStorage.getItem('have-seen-notifications') === 'true'
  });

  return {
    latestSeenTimestamp: useStorage('latest-seen-notification-timestamp', '0'),
    haveSeenNotificationsStorage,
    haveSeenNotifications: haveSeenNotificationsRef,
  };
}

export function trackLatestSeenNotification() {
  const { haveSeenNotificationsStorage, latestSeenTimestamp, haveSeenNotifications } =
    useHaveSeenNotifications();

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
    //     console.log('no latest notif, setting seen to false');
    //   haveSeenNotificationsStorage.value = false;
      return;
    }
    console.log('setting notif seen', isBeforeLastSeen(latestNotificationTimestamp.value));
    haveSeenNotificationsStorage.value = isBeforeLastSeen(latestNotificationTimestamp.value);
  });

  return {
    latestNotification,
    latestNotificationTimestamp,
    haveSeenNotificationsStorage,
    latestSeenTimestamp,
    haveSeenNotifications,
    isBeforeLastSeen,
  };
}
