<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useMutation, useQuery, useSubscription } from '@vue/apollo-composable';

import { AlertTriangle, Octagon } from 'lucide-vue-next';

import type { FragmentType } from '~/composables/gql';
import type {
  NotificationFragmentFragment,
  WarningAndAlertNotificationsQuery,
  WarningAndAlertNotificationsQueryVariables,
} from '~/composables/gql/graphql';

import {
  archiveNotification,
  NOTIFICATION_FRAGMENT,
  warningsAndAlerts,
} from '~/components/Notifications/graphql/notification.query';
import {
  notificationAddedSubscription,
  warningsAndAlertsSubscription,
} from '~/components/Notifications/graphql/notification.subscription';
import { useFragment } from '~/composables/gql';
import { NotificationImportance } from '~/composables/gql/graphql';

const { result, loading, error, refetch } = useQuery<
  WarningAndAlertNotificationsQuery,
  WarningAndAlertNotificationsQueryVariables
>(warningsAndAlerts, {} as WarningAndAlertNotificationsQueryVariables, {
  fetchPolicy: 'network-only',
});

const criticalNotifications = ref<NotificationFragmentFragment[]>([]);

type NotificationFragmentReference = FragmentType<typeof NOTIFICATION_FRAGMENT>;

const extractNotifications = (
  notifications: readonly NotificationFragmentReference[] | null | undefined
): NotificationFragmentFragment[] => {
  if (!notifications?.length) {
    return [];
  }
  const extracted = useFragment(NOTIFICATION_FRAGMENT, notifications);
  return extracted ? [...extracted] : [];
};

const setNotifications = (incoming: readonly NotificationFragmentReference[] | null | undefined) => {
  criticalNotifications.value = extractNotifications(incoming);
};

watch(
  () => result.value?.notifications?.warningsAndAlerts,
  (list) => {
    if (list) {
      setNotifications(list);
    } else if (!loading.value) {
      criticalNotifications.value = [];
    }
  },
  { immediate: true }
);

const { onResult: onWarningsAndAlerts } = useSubscription(warningsAndAlertsSubscription);

onWarningsAndAlerts(({ data }) => {
  if (!data) {
    return;
  }
  setNotifications(data.notificationsWarningsAndAlerts);
});

const { mutate: archiveNotificationMutate } = useMutation(archiveNotification);
const dismissing = reactive(new Set<string>());

const formatTimestamp = (notification: NotificationFragmentFragment) => {
  if (notification.formattedTimestamp) {
    return notification.formattedTimestamp;
  }
  if (!notification.timestamp) {
    return '';
  }
  const parsed = new Date(notification.timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toLocaleString();
};

const importanceMeta: Record<
  NotificationImportance,
  { label: string; badge: string; icon: typeof AlertTriangle; accent: string }
> = {
  [NotificationImportance.ALERT]: {
    label: 'Alert',
    badge: 'bg-red-100 text-red-700 border border-red-300',
    icon: Octagon,
    accent: 'text-red-600',
  },
  [NotificationImportance.WARNING]: {
    label: 'Warning',
    badge: 'bg-amber-100 text-amber-700 border border-amber-300',
    icon: AlertTriangle,
    accent: 'text-amber-600',
  },
  [NotificationImportance.INFO]: {
    label: 'Info',
    badge: 'bg-blue-100 text-blue-700 border border-blue-300',
    icon: AlertTriangle,
    accent: 'text-blue-600',
  },
};

const enrichedNotifications = computed(() =>
  criticalNotifications.value.map((notification) => ({
    notification,
    displayTimestamp: formatTimestamp(notification),
    meta: importanceMeta[notification.importance],
  }))
);

const totalCount = computed(() => criticalNotifications.value.length);

const dismissNotification = async (notification: NotificationFragmentFragment) => {
  if (dismissing.has(notification.id)) {
    return;
  }
  dismissing.add(notification.id);
  try {
    await archiveNotificationMutate({
      id: notification.id,
    });
    criticalNotifications.value = criticalNotifications.value.filter(
      (current) => current.id !== notification.id
    );
  } catch (dismissError) {
    console.error('[CriticalNotifications] Failed to dismiss notification', dismissError);
  } finally {
    dismissing.delete(notification.id);
  }
};

const { onResult: onNotificationAdded } = useSubscription(notificationAddedSubscription);

onNotificationAdded(({ data }) => {
  if (!data?.notificationAdded) {
    return;
  }

  // Access raw subscription data directly - don't call useFragment in async callback
  const rawNotification = data.notificationAdded as unknown as NotificationFragmentFragment;
  if (
    !rawNotification ||
    (rawNotification.importance !== NotificationImportance.ALERT &&
      rawNotification.importance !== NotificationImportance.WARNING)
  ) {
    return;
  }

  void refetch();

  if (!globalThis.toast) {
    return;
  }

  if (rawNotification.timestamp) {
    // Trigger the global toast in tandem with the subscription update.
    const funcMapping: Record<
      NotificationImportance,
      (typeof globalThis)['toast']['info' | 'error' | 'warning']
    > = {
      [NotificationImportance.ALERT]: globalThis.toast.error,
      [NotificationImportance.WARNING]: globalThis.toast.warning,
      [NotificationImportance.INFO]: globalThis.toast.info,
    };
    const toast = funcMapping[rawNotification.importance];
    const createOpener = () => ({
      label: 'Open',
      onClick: () => rawNotification.link && window.open(rawNotification.link, '_blank', 'noopener'),
    });

    requestAnimationFrame(() =>
      toast(rawNotification.title, {
        description: rawNotification.subject,
        action: rawNotification.link ? createOpener() : undefined,
      })
    );
  }
});
</script>

<template>
  <section class="flex flex-col gap-4 rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
    <header class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <AlertTriangle class="h-5 w-5 text-amber-600" aria-hidden="true" />
        <h2 class="text-base font-semibold text-gray-900">Warnings & Alerts</h2>
      </div>
      <span
        v-if="!loading"
        class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
      >
        {{ totalCount }}
      </span>
    </header>

    <div v-if="error" class="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      Failed to load notifications. {{ error.message ?? '' }}
    </div>

    <div v-else-if="loading" class="flex items-center gap-2 text-sm text-gray-500">
      <span class="h-2 w-2 animate-pulse rounded-full bg-amber-400" aria-hidden="true" />
      Loading latest notifications…
    </div>

    <ul v-else-if="enrichedNotifications.length" class="flex flex-col gap-3">
      <li
        v-for="{ notification, displayTimestamp, meta } in enrichedNotifications"
        :key="notification.id"
        class="grid gap-2 rounded-md border border-gray-200 p-3 transition hover:border-amber-300"
      >
        <div class="flex items-start gap-3">
          <component
            :is="meta.icon"
            class="mt-0.5 h-5 w-5 flex-none"
            :class="meta.accent"
            aria-hidden="true"
          />
          <div class="flex flex-1 flex-col gap-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="meta.badge">
                {{ meta.label }}
              </span>
              <span v-if="displayTimestamp" class="text-xs font-medium text-gray-500">
                {{ displayTimestamp }}
              </span>
            </div>
            <p class="text-sm font-semibold text-gray-900">
              {{ notification.title }}
            </p>
            <p class="text-sm text-gray-600">
              {{ notification.subject }}
            </p>
            <p v-if="notification.description" class="text-sm text-gray-500">
              {{ notification.description }}
            </p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 pt-1">
          <a
            v-if="notification.link"
            :href="notification.link"
            class="inline-flex items-center gap-1 rounded-md border border-amber-500 px-3 py-1 text-sm font-medium text-amber-700 transition hover:bg-amber-50"
            target="_blank"
            rel="noreferrer"
          >
            View Details
          </a>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="dismissing.has(notification.id)"
            @click="dismissNotification(notification)"
          >
            {{ dismissing.has(notification.id) ? 'Dismissing…' : 'Dismiss' }}
          </button>
        </div>
      </li>
    </ul>

    <div v-else class="flex flex-col items-start gap-2 rounded-md border border-gray-200 p-3">
      <div class="flex items-center gap-2 text-sm font-medium text-gray-700">
        <span class="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
        All clear. No active warnings or alerts.
      </div>
      <p class="text-sm text-gray-500">
        This panel automatically refreshes when new warnings or alerts are generated.
      </p>
    </div>
  </section>
</template>
