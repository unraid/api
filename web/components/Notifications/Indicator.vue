<script setup lang="ts">
import { BellIcon, ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/vue/24/solid';
import { cn } from '~/components/shadcn/utils';
import { Importance, type OverviewQuery } from '~/composables/gql/graphql';

const props = defineProps<{ overview?: OverviewQuery['notifications']['overview']; seen?: boolean }>();

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

watchEffect(() => {
  console.log('notifs seen prop', props.seen, localStorage.getItem('have-seen-notifications'), typeof localStorage.getItem('have-seen-notifications'));
});

const notSeen =computed(() => {
  console.log('debugging notif seen prop type', typeof props.seen, props.seen);
  return typeof props.seen !== 'undefined' && !props.seen; 
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
</script>

<template>
  <div class="relative">
    <BellIcon class="w-6 h-6 text-header-text-primary" />
    <div
      v-if="notSeen && indicatorLevel === 'UNREAD'"
      class="absolute top-0 right-0 size-2.5 rounded-full border border-neutral-800 bg-unraid-green"
    />
    <component
      :is="icon.component"
      v-else-if="notSeen && icon && indicatorLevel"
      :class="cn('absolute -top-1 -right-1 size-4 rounded-full', icon.color)"
    />
  </div>
</template>
