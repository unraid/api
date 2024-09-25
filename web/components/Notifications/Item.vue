<script setup lang="ts">
import {
  ArchiveBoxIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ShieldExclamationIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/solid';

import type { NotificationItemProps } from '~/types/ui/notification';

const props = defineProps<NotificationItemProps>();

const icon = computed<{ component: Component, color: string } | null>(() => {
  switch (props.type) {
    case 'success':
      return {
        component: CheckBadgeIcon,
        color: 'text-green-500',
      };
    case 'warning':
      return {
        component: ExclamationTriangleIcon,
        color: 'text-yellow-500',
      };
    case 'alert':
      return {
        component: ShieldExclamationIcon,
        color: 'text-red-500',
      };
  }
  return null;
});
</script>

<template>
  <div class="w-full flex flex-row items-center justify-between py-4">
    <header class="flex flex-col gap-2">
      <h3 class="text-md font-semibold flex flex-row items-center gap-2">
        <component :is="icon.component" v-if="icon" class="size-6" :class="icon.color" />
        <span>{{ subject }}</span>
      </h3>
      <p>{{ message }}</p>
    </header>
    <footer>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <span class="sr-only">View Notification Actions</span>
          <EllipsisVerticalIcon class="size-6" />
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <!-- <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator /> -->
          <DropdownMenuItem class="flex flex-row justify-between items-center">
            Archive
            <ArchiveBoxIcon class="size-4" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="flex flex-row justify-between items-center">
            Delete
            <TrashIcon class="size-4" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </footer>
  </div>
</template>