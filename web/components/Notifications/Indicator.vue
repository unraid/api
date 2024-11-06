<script setup lang="ts">
import { useSubscription } from "@vue/apollo-composable";
import {
  NOTIFICATION_COUNT_FRAGMENT,
  unreadsSubscription,
} from "./graphql/notification.query";
import { useFragment } from "~/composables/gql";
import { Importance } from "~/composables/gql/graphql";
import {
  BellIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
} from "@heroicons/vue/24/solid";
import { cn } from "../shadcn/utils";
const { result } = useSubscription(unreadsSubscription);

const overview = computed(() => {
  return useFragment(
    NOTIFICATION_COUNT_FRAGMENT,
    result.value?.notificationsOverview.unread
  );
});

const indicatorState = computed(() => {
  if (!overview.value) {
    return undefined;
  }
  switch (true) {
    case overview.value.alert > 0:
      return Importance.Alert;
    case overview.value.warning > 0:
      return Importance.Warning;
    case overview.value.total > 0:
      return "UNREAD";
    default:
      return undefined;
  }
});

const icon = computed<{ component: Component; color: string } | null>(() => {
  switch (indicatorState.value) {
    case Importance.Warning:
      return {
        component: ExclamationTriangleIcon,
        color: "text-yellow-500 translate-y-0.5",
      };
    case Importance.Alert:
      return {
        component: ShieldExclamationIcon,
        color: "text-red-500",
      };
  }
  return null;
});
</script>

<template>
  <div class="flex items-end gap-1">
    <div class="relative">
      <BellIcon class="w-6 h-6" />
      <div
        v-if="indicatorState"
        :class="
          cn('absolute top-0 right-0 size-2.5 rounded-full', {
            'bg-unraid-red': indicatorState === Importance.Alert,
            'bg-yellow-500': indicatorState === Importance.Warning,
            'bg-green-500': indicatorState === 'UNREAD',
          })
        "
      />
      <div
        v-if="indicatorState === Importance.Alert"
        class="absolute top-0 right-0 size-2.5 rounded-full bg-unraid-red animate-ping"
      />
    </div>
    <component
      :is="icon.component"
      v-if="icon"
      :class="cn('size-6', icon.color)"
    />
  </div>
</template>
