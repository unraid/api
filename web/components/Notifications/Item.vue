<script setup lang="ts">
import {
  ArchiveBoxIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ShieldExclamationIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
} from "@heroicons/vue/24/solid";

import type { NotificationItemProps } from "~/types/ui/notification";

const props = defineProps<NotificationItemProps>();

const icon = computed<{ component: Component; color: string } | null>(() => {
  switch (props.type) {
    case "success":
      return {
        component: CheckBadgeIcon,
        color: "text-green-500",
      };
    case "warning":
      return {
        component: ExclamationTriangleIcon,
        color: "text-yellow-500",
      };
    case "alert":
      return {
        component: ShieldExclamationIcon,
        color: "text-red-500",
      };
    default:
      return null;
  }
});

const archive = async () => {
  console.log("Archive", props.id);
};
</script>

<template>
  <div class="relative w-full flex flex-col gap-3 p-4">
    <header class="flex flex-row items-start gap-2">
      <h3 class="text-md font-semibold flex flex-row justify-between items-start gap-2">
        <component
          :is="icon.component"
          v-if="icon"
          class="shrink-0 size-6"
          :class="icon.color"
        />
        <span class="leading-4">{{ event }} • {{ subject }}</span>
      </h3>
      <div class="flex flex-row items-center mt-1 gap-2 shrink-0">
        <p class="text-grey-dark text-xs">{{ date }}</p>
        <button class="relative z-20 group transition-opacity" @click="archive">
          <DaisyUiTooltip position="left" text="Archive">
            <ArchiveBoxIcon
              class="opacity-100 group-hover:opacity-40 group-focus:opacity-40 size-4"
            />
          </DaisyUiTooltip>
        </button>
      </div>
    </header>
    <div class="flex flex-row justify-between items-center gap-2">
      <p>{{ message }}</p>
      <ChevronRightIcon v-if="view" class="size-4" />
    </div>

    <a v-if="view" :href="view" class="absolute inset-0" />
  </div>
</template>
