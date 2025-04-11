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
import { Button } from '@unraid/ui';
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

const reformattedTimestamp = computed<string>(() => {
  if (!props.timestamp) return '';
  const userLocale = navigator.language ?? 'en-US'; // Get the user's browser language (e.g., 'en-US', 'fr-FR')

  const reformattedDate = new Intl.DateTimeFormat(userLocale, {
    localeMatcher: 'best fit',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: ['AM', 'PM'].some((period) => (props.formattedTimestamp ?? 'AM').includes(period)),
  }).format(new Date(props.timestamp));
  return reformattedDate;
});
</script>

<template>
  <div class="group/item relative py-5 flex flex-col gap-2 text-base">
    <header class="flex flex-row items-baseline justify-between gap-2 -translate-y-1">
      <h3
        class="tracking-normal flex flex-row items-baseline gap-2 uppercase font-bold overflow-x-hidden"
      >
        <!-- the `translate` compensates for extra space added by the `svg` element when rendered -->
        <component
          :is="icon.component"
          v-if="icon"
          class="size-5 shrink-0 translate-y-1"
          :class="icon.color"
        />
        <span class="truncate flex-1" :title="title">{{ title }}</span>
      </h3>

      <div
        class="shrink-0 flex flex-row items-baseline justify-end gap-2 mt-1"
        :title="formattedTimestamp ?? reformattedTimestamp"
      >
        <p class="text-secondary-foreground text-sm">{{ reformattedTimestamp }}</p>
      </div>
    </header>

    <h4 class="font-bold">
      {{ subject }}
    </h4>

    <div class="flex flex-row items-center justify-between gap-2">
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
        v-if="type === NotificationType.UNREAD"
        :disabled="archive.loading"
        @click="archive.mutate"
      >
        <ArchiveBoxIcon class="size-4 mr-2" />
        <span class="text-sm">Archive</span>
      </Button>
      <Button
        v-if="type === NotificationType.ARCHIVE"
        :disabled="deleteNotification.loading"
        @click="deleteNotification.mutate"
      >
        <TrashIcon class="size-4 mr-2" />
        <span class="text-sm">Delete</span>
      </Button>
    </div>
  </div>
</template>
