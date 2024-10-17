<script setup lang="ts">
import {
  ArchiveBoxIcon,
  ShieldExclamationIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  LinkIcon,
} from "@heroicons/vue/24/solid";
import { useMutation } from "@vue/apollo-composable";
import type { NotificationFragmentFragment } from "~/composables/gql/graphql";
import { archiveNotification as archiveMutation } from "./graphql/notification.query";

const props = defineProps<NotificationFragmentFragment>();

const icon = computed<{ component: Component; color: string } | null>(() => {
  switch (props.importance) {
    case "INFO":
      return {
        component: CheckBadgeIcon,
        color: "text-green-500",
      };
    case "WARNING":
      return {
        component: ExclamationTriangleIcon,
        color: "text-yellow-500",
      };
    case "ALERT":
      return {
        component: ShieldExclamationIcon,
        color: "text-red-500",
      };
  }
  return null;
});

const { mutate: archive, loading } = useMutation(archiveMutation, {
  variables: { id: props.id },
});
</script>

<template>
  <div class="group/item relative w-full py-4 pl-1 flex flex-col gap-2">
    <header
      class="w-full flex flex-row items-baseline justify-between gap-2 -translate-y-1 group-hover/item:font-medium group-focus/item:font-medium"
    >
      <h3
        class="text-muted-foreground text-[0.875rem] tracking-wide flex flex-row items-baseline gap-2 uppercase"
      >
        <!-- the `translate` compensates for extra space added by the `svg` element when rendered -->
        <component
          :is="icon.component"
          v-if="icon"
          class="size-5 shrink-0 translate-y-1.5"
          :class="icon.color"
        />
        <span>{{ title }}</span>
      </h3>

      <div class="shrink-0 flex flex-row items-baseline justify-end gap-2 mt-1">
        <p class="text-12px opacity-75">{{ timestamp }}</p>
      </div>
    </header>

    <h4 class="group-hover/item:font-medium group-focus/item:font-medium">
      {{ subject }}
    </h4>

    <div
      class="w-full flex flex-row items-center justify-between gap-2 opacity-75 group-hover/item:opacity-100 group-focus/item:opacity-100"
    >
      <p class="text-secondary-foreground">{{ description }}</p>
    </div>

    <div class="flex justify-end items-baseline gap-2">
      <a v-if="link" :href="link">
        <Button type="button" variant="outline" size="xs">
          <LinkIcon class="size-3 mr-1 text-muted-foreground/80" />
          <span class="text-sm text-muted-foreground mt-0.5">View</span>
        </Button>
      </a>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
            :disabled="loading"
            class="relative z-20 rounded"
            size="xs"
            @click="archive"
            >
              <ArchiveBoxIcon class="size-3 mr-1" />
              <span class="text-sm mt-0.5">Archive</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Archive</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
</template>
