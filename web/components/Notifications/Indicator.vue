<script setup lang="ts">
import { BellIcon, ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/vue/24/solid';
import { cn } from '~/components/shadcn/utils';
import { Importance, type OverviewQuery } from '~/composables/gql/graphql';
import { onWatcherCleanup } from 'vue';

const props = defineProps<{ overview?: OverviewQuery['notifications']['overview'] }>();

const indicatorLevel = computed(() => {
  if (!props.overview?.unread) {
    return undefined;
  }
  switch (true) {
    case props.overview.unread.alert > 0:
      return Importance.Alert;
    case props.overview.unread.warning > 0:
      return Importance.Warning;
    case props.overview.unread.total > 0:
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
watch(
  () => props.overview?.unread,
  (newVal, oldVal) => {
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
  }
);
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
