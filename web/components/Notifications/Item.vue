<script setup lang="ts">
import { Markdown } from '@/helpers/markdown';
import {
  ArchiveBoxIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  ShieldExclamationIcon,
  TrashIcon,
} from '@heroicons/vue/24/solid';
import { useMutation } from '@vue/apollo-composable';
import type { NotificationFragmentFragment } from '~/composables/gql/graphql';
import { NotificationType } from '~/composables/gql/graphql';
import {
  archiveNotification as archiveMutation,
  deleteNotification as deleteMutation,
} from './graphql/notification.query';

const props = defineProps<NotificationFragmentFragment>();

const descriptionMarkup = computedAsync(async () => {
  try {
    return await Markdown.parse(props.description);
  } catch (e) {
    console.error(e);
    return props.description;
  }
}, '');

const icon = computed<{ component: Component; color: string } | null>(() => {
  switch (props.importance) {
    case 'INFO':
      return {
        component: CheckBadgeIcon,
        color: 'text-unraid-green',
      };
    case 'WARNING':
      return {
        component: ExclamationTriangleIcon,
        color: 'text-yellow-accent',
      };
    case 'ALERT':
      return {
        component: ShieldExclamationIcon,
        color: 'text-unraid-red',
      };
  }
  return null;
});

const archive = reactive(
  useMutation(archiveMutation, {
    variables: { id: props.id },
  })
);

const deleteNotification = reactive(
  useMutation(deleteMutation, {
    variables: { id: props.id, type: props.type },
  })
);

const mutationError = computed(() => {
  return archive.error?.message ?? deleteNotification.error?.message;
});
</script>

<template>
  <!-- fixed width hack ensures alignment with other elements regardless of scrollbar presence or width -->
  <div class="group/item relative py-5 flex flex-col gap-2 text-base w-[487px]">
    <header class="w-full flex flex-row items-baseline justify-between gap-2 -translate-y-1">
      <h3 class="tracking-normal flex flex-row items-baseline gap-2 uppercase font-bold">
        <!-- the `translate` compensates for extra space added by the `svg` element when rendered -->
        <component
          :is="icon.component"
          v-if="icon"
          class="size-5 shrink-0 translate-y-1"
          :class="icon.color"
        />
        <span>{{ title }}</span>
      </h3>

      <div class="shrink-0 flex flex-row items-baseline justify-end gap-2 mt-1">
        <p class="text-gray-500 text-sm">{{ formattedTimestamp }}</p>
      </div>
    </header>

    <h4 class="font-bold">
      {{ subject }}
    </h4>

    <div class="w-full flex flex-row items-center justify-between gap-2">
      <div class="" v-html="descriptionMarkup" />
    </div>

    <p v-if="mutationError" class="text-red-600">Error: {{ mutationError }}</p>

    <div class="flex justify-end items-baseline gap-4">
      <a v-if="link" :href="link">
        <Button type="button" variant="outline">
          <LinkIcon class="size-4 mr-2" />
          <span class="text-sm">View</span>
        </Button>
      </a>
      <Button
        v-if="type === NotificationType.Unread"
        :disabled="archive.loading"
        @click="archive.mutate"
      >
        <ArchiveBoxIcon class="size-4 mr-2" />
        <span class="text-sm">Archive</span>
      </Button>
      <Button
        v-if="type === NotificationType.Archive"
        :disabled="deleteNotification.loading"
        @click="deleteNotification.mutate"
      >
        <TrashIcon class="size-4 mr-2" />
        <span class="text-sm">Delete</span>
      </Button>
    </div>
  </div>
</template>
