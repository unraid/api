<script setup lang="ts">
import { computed } from 'vue';
import { useQuery, useSubscription } from '@vue/apollo-composable';

import { AlertTriangle, Octagon } from 'lucide-vue-next';

import type {
  NotificationFragmentFragment,
  WarningAndAlertNotificationsQuery,
  WarningAndAlertNotificationsQueryVariables,
} from '~/composables/gql/graphql';

import {
  NOTIFICATION_FRAGMENT,
  warningsAndAlerts,
} from '~/components/Notifications/graphql/notification.query';
import {
  notificationAddedSubscription,
  notificationOverviewSubscription,
} from '~/components/Notifications/graphql/notification.subscription';
import { useFragment } from '~/composables/gql';
import { NotificationImportance } from '~/composables/gql/graphql';

const { result, loading, refetch, error } = useQuery<
  WarningAndAlertNotificationsQuery,
  WarningAndAlertNotificationsQueryVariables
>(warningsAndAlerts, undefined, {
  fetchPolicy: 'network-only',
});

const extractNotifications = (
  notifications: NotificationFragmentFragment[] | null | undefined
): NotificationFragmentFragment[] => {
  if (!notifications?.length) {
    return [];
  }
  return useFragment(NOTIFICATION_FRAGMENT, notifications) ?? [];
};

const notifications = computed<NotificationFragmentFragment[]>(() => {
  const data = result.value?.notifications?.warningsAndAlerts;
  return extractNotifications(data);
});

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
  notifications.value.map((notification) => ({
    notification,
    displayTimestamp: formatTimestamp(notification),
    meta: importanceMeta[notification.importance],
  }))
);

useSubscription(notificationAddedSubscription, null, {
  onResult: ({ data }) => {
    if (!data) {
      return;
    }
    const notification = useFragment(NOTIFICATION_FRAGMENT, data.notificationAdded);
    if (
      !notification ||
      (notification.importance !== NotificationImportance.ALERT &&
        notification.importance !== NotificationImportance.WARNING)
    ) {
      return;
    }
    void refetch();
  },
});

useSubscription(notificationOverviewSubscription, null, {
  onResult: () => {
    void refetch();
  },
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
        {{ notifications.length }}
      </span>
    </header>

    <div v-if="error" class="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      Failed to load notifications. Please try again.
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
        <a
          v-if="notification.link"
          :href="notification.link"
          class="inline-flex w-fit items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800"
          target="_blank"
          rel="noreferrer"
        >
          View details
        </a>
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
