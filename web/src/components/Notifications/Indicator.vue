<script setup lang="ts">
import { computed } from 'vue';

import { BellIcon, ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/vue/24/solid';
import { cn } from '@unraid/ui';

import type { OverviewQuery } from '~/composables/gql/graphql';
import type { Component } from 'vue';

import { NotificationImportance as Importance } from '~/composables/gql/graphql';

const props = defineProps<{ overview?: OverviewQuery['notifications']['overview']; seen?: boolean }>();

// The bell reflects unread + active: new transient notifications AND ongoing
// ("Active") conditions both light it.
const counts = computed(() => {
  const o = props.overview;
  if (!o) return undefined;
  return {
    alert: o.unread.alert + o.active.alert,
    warning: o.unread.warning + o.active.warning,
    total: o.unread.total + o.active.total,
    activeTotal: o.active.total,
    unreadTotal: o.unread.total,
  };
});

const indicatorLevel = computed(() => {
  const c = counts.value;
  if (!c) return undefined;
  switch (true) {
    case c.alert > 0:
      return Importance.ALERT;
    case c.warning > 0:
      return Importance.WARNING;
    case c.total > 0:
      return 'UNREAD';
    default:
      return undefined;
  }
});

// Active conditions are ongoing, so they keep the bell lit regardless of "seen";
// transient unread only lights it until the user has seen them.
const shouldShow = computed(() => {
  const c = counts.value;
  if (!c) return false;
  return c.activeTotal > 0 || (!props.seen && c.unreadTotal > 0);
});

const icon = computed<{ component: Component; color: string } | null>(() => {
  switch (indicatorLevel.value) {
    case Importance.WARNING:
      return {
        component: ExclamationTriangleIcon,
        color: 'text-yellow-500 translate-y-0.5',
      };
    case Importance.ALERT:
      return {
        component: ShieldExclamationIcon,
        color: 'text-unraid-red',
      };
  }
  return null;
});
</script>

<template>
  <div class="relative flex items-center justify-center">
    <BellIcon class="text-header-text-primary h-6 w-6" />
    <div
      v-if="shouldShow && indicatorLevel === 'UNREAD'"
      class="border-muted bg-unraid-green absolute top-0 right-0 size-2.5 rounded-full border"
    />
    <component
      :is="icon.component"
      v-else-if="shouldShow && icon && indicatorLevel"
      :class="cn('absolute -top-1 -right-1 size-4 rounded-full', icon.color)"
    />
  </div>
</template>
