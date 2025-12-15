<script setup lang="ts">
import { computed } from 'vue';

import { cn } from '@unraid/ui';

import type { OverviewQuery } from '~/composables/gql/graphql';

import { NOTIFICATION_COLORS, NOTIFICATION_ICONS } from '~/components/Notifications/constants';
import { NotificationImportance as Importance } from '~/composables/gql/graphql';

const props = defineProps<{ overview?: OverviewQuery['notifications']['overview']; seen?: boolean }>();

const indicatorLevel = computed(() => {
  if (!props.overview?.unread) {
    return undefined;
  }
  switch (true) {
    case props.overview.unread.alert > 0:
      return Importance.ALERT;
    case props.overview.unread.warning > 0:
      return Importance.WARNING;
    case props.overview.unread.total > 0:
      return 'UNREAD';
    default:
      return undefined;
  }
});

const icon = computed<{ name: string; color: string } | null>(() => {
  const level = indicatorLevel.value;

  if (level !== Importance.WARNING && level !== Importance.ALERT) {
    return null;
  }

  return {
    name: NOTIFICATION_ICONS[level],
    color: cn(NOTIFICATION_COLORS[level], {
      'translate-y-0.5': level === Importance.WARNING,
    }),
  };
});
</script>

<template>
  <div class="relative flex items-center justify-center">
    <UIcon name="i-heroicons-bell-20-solid" class="size-6" />
    <div
      v-if="!seen && indicatorLevel === 'UNREAD'"
      class="border-muted bg-unraid-green absolute top-0 right-0 size-2.5 rounded-full border"
    />
    <UIcon
      v-else-if="!seen && icon && indicatorLevel"
      :name="icon.name"
      :class="cn('absolute -top-1 -right-1 size-4 rounded-full', icon.color)"
    />
  </div>
</template>
