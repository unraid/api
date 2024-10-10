<script setup lang="ts">
import {
  ArchiveBoxIcon,
  ShieldExclamationIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/solid';

import type { NotificationItemProps } from '~/types/ui/notification';

const props = defineProps<NotificationItemProps>();

const icon = computed<{ component: Component, color: string } | null>(() => {
  switch (props.importance) {
    case 'INFO':
      return {
        component: CheckBadgeIcon,
        color: 'text-green-500',
      };
    case 'WARNING':
      return {
        component: ExclamationTriangleIcon,
        color: 'text-yellow-500',
      };
    case 'ALERT':
      return {
        component: ShieldExclamationIcon,
        color: 'text-red-500',
      };
  }
  return null;
});
</script>

<template>
  <div class="group/item relative w-full py-4 pl-1 flex flex-col gap-2">
    <header class="w-full flex flex-row items-start justify-between gap-2">
      <h3 class="text-16px font-semibold leading-2 flex flex-row items-start gap-2">
        <component :is="icon.component" v-if="icon" class="size-6 shrink-0" :class="icon.color" />
        <span>{{ title }} • {{ subject }}</span>
      </h3>

      <div class="shrink-0 flex flex-row items-center justify-end gap-2 mt-1">
        <p class="text-12px opacity-75">{{ timestamp }}</p>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <button class="relative z-20">
                <span class="sr-only">Archive</span>
                <ArchiveBoxIcon class="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Archive</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>

    <div class="w-full flex flex-row items-center justify-between gap-2 opacity-75 group-hover/item:opacity-100 group-focus/item:opacity-100">
      <p>{{ description }}</p>
      <ChevronRightIcon class="size-4" />
    </div>

    <a :href="link" class="absolute z-10 inset-0">
      <span class="sr-only">Take me there</span>
    </a>
  </div>
</template>