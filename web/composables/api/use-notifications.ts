import { useQuery } from '@vue/apollo-composable';
import { useStorage } from '@vueuse/core';
import {
  getNotifications,
  NOTIFICATION_FRAGMENT,
} from '~/components/Notifications/graphql/notification.query';
import { useFragment } from '~/composables/gql/fragment-masking';
import { NotificationType } from '../gql/graphql';

const LATEST_SEEN_TIMESTAMP_KEY = 'latest-seen-notification-timestamp';
const HAVE_SEEN_NOTIFICATIONS_KEY = 'have-seen-notifications';

/**
 * Composable for managing user's state of having seen notifications.
 *
 * Returns reactive references to two local-storage values:
 *   - `latestSeenTimestamp`: timestamp of the latest notification that has been viewed.
 *   - `haveSeenNotifications`: a boolean indicating whether the user has seen their notifications.
 *
 * Both properties are reactive refs and updating them will persist to local storage.
 *
 * `haveSeenNotifications` is considered derived-state and should not be modified directly, outside of
 * related composables. Instead, update `latestSeenTimestamp` to affect global state.
 */
export function useHaveSeenNotifications() {
  return {
    /**
     * Local-storage Timestamp of the latest notification that has been viewed.
     * It should be modified externally, when user views their notifications.
     *
     * Writing this ref will persist to local storage and affect global state.
     */
    latestSeenTimestamp: useStorage(LATEST_SEEN_TIMESTAMP_KEY, new Date(0).toISOString()),
    /**
     * Local-storage global state of whether a user has seen their notifications.
     * Consider this derived-state and avoid modifying this directly, outside of
     * related composables.
     *
     * Writing this ref will persist to local storage and affect global state.
     */
    haveSeenNotifications: useStorage<boolean>(HAVE_SEEN_NOTIFICATIONS_KEY, null),
  };
}

export function useTrackLatestSeenNotification() {
  const { latestSeenTimestamp, haveSeenNotifications } = useHaveSeenNotifications();
  const { result: latestNotifications } = useQuery(getNotifications, () => ({
    filter: {
      offset: 0,
      limit: 1,
      type: NotificationType.UNREAD,
    },
  }));
  const latestNotification = computed(() => {
    const list = latestNotifications.value?.notifications.list;
    if (!list) return;
    const [notification] = useFragment(NOTIFICATION_FRAGMENT, list);
    return notification;
  });

  // initialize timestamp of latest notification
  const latestNotificationTimestamp = ref<string | null>();
  const stopLatestInit = watchOnce(latestNotification, () => {
    latestNotificationTimestamp.value = latestNotification.value?.timestamp;
  });
  // prevent memory leak in edge case
  onUnmounted(() => stopLatestInit());

  const isBeforeLastSeen = (timestamp?: string | null) =>
    new Date(timestamp ?? '0') <= new Date(latestSeenTimestamp.value);

  // derive haveSeenNotifications by comparing last seen's timestamp to latest's timestamp
  watchEffect(() => {
    if (!latestNotificationTimestamp.value) {
      return;
    }
    haveSeenNotifications.value = isBeforeLastSeen(latestNotificationTimestamp.value);
    console.log('[use-notifications] set haveSeenNotifications to', haveSeenNotifications.value);
  });

  return {
    /**
     * In-memory timestamp of the latest notification in the system.
     * Loaded automatically upon init, but not explicitly tracked.
     *
     * It is safe/expected to mutate this ref from other events, such as incoming notifications.
     * This will cause re-computation of `haveSeenNotifications` state.
     */
    latestNotificationTimestamp,
    /**
     * Derived state of whether a user has seen their notifications. Avoid mutating directly.
     *
     * Writing this ref will persist to local storage and affect global state.
     */
    haveSeenNotifications,
  };
}
