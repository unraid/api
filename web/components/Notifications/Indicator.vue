<script setup lang="ts">
import { BellIcon, ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/vue/24/solid';
import { useQuery } from '@vue/apollo-composable';
import { cn } from '~/components/shadcn/utils';
import { Importance } from '~/composables/gql/graphql';
import { onWatcherCleanup } from 'vue';
import { unreadOverview } from './graphql/notification.query';

const { result } = useQuery(unreadOverview, null, {
  pollInterval: 2_000, // 2 seconds
});

const overview = computed(() => {
  if (!result.value) {
    return;
  }
  return result.value.notifications.overview.unread;
});

const indicatorLevel = computed(() => {
  if (!overview.value) {
    return undefined;
  }
  switch (true) {
    case overview.value.alert > 0:
      return Importance.Alert;
    case overview.value.warning > 0:
      return Importance.Warning;
    case overview.value.total > 0:
      return 'UNREAD';
    default:
      return undefined;
  }
});

const icon = computed<{ component: Component; color: string } | null>(() => {
  switch (indicatorLevel.value) {
    case Importance.Warning:
      return {
        component: ExclamationTriangleIcon,
        color: 'text-yellow-500 translate-y-0.5',
      };
    case Importance.Alert:
      return {
        component: ShieldExclamationIcon,
        color: 'text-unraid-red',
      };
  }
  return null;
});

/** whether new notifications ocurred */
const hasNewNotifications = ref(false);
// watch for new notifications, set a temporary indicator when they're reveived
watch(overview, (newVal, oldVal) => {
  if (!newVal || !oldVal) {
    return;
  }
  hasNewNotifications.value = newVal.total > oldVal.total;
  // lifetime of 'new notification' state
  const msToLive = 30_000;
  const timeout = setTimeout(() => {
    hasNewNotifications.value = false;
  }, msToLive);
  onWatcherCleanup(() => clearTimeout(timeout));
});
</script>

<template>
  <div class="flex items-end gap-1 text-header-text-primary">
    <div class="relative">
      <BellIcon class="w-6 h-6" />
      <div
        v-if="indicatorLevel"
        :class="
          cn('absolute top-0 right-0 size-2.5 rounded-full border border-neutral-800', {
            'bg-unraid-red': indicatorLevel === Importance.Alert,
            'bg-yellow-accent': indicatorLevel === Importance.Warning,
            'bg-unraid-green': indicatorLevel === 'UNREAD',
          })
        "
      />
      <div
        v-if="hasNewNotifications || indicatorLevel === Importance.Alert"
        class="absolute top-0 right-0 size-2.5 rounded-full bg-unraid-red animate-ping"
      />
    </div>
    <component :is="icon.component" v-if="icon" :class="cn('size-6', icon.color)" />
  </div>
</template>
