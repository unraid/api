<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation } from '@vue/apollo-composable';
import { computedAsync } from '@vueuse/core';

import {
  ArchiveBoxIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  ShieldExclamationIcon,
  TrashIcon,
} from '@heroicons/vue/24/solid';
import { Button } from '@unraid/ui';
import { Markdown } from '@/helpers/markdown';

import type { NotificationFragmentFragment } from '~/composables/gql/graphql';
import type { Component } from 'vue';

import {
  archiveNotification as archiveMutation,
  deleteNotification as deleteMutation,
} from '~/components/Notifications/graphql/notification.query';
import { NotificationType } from '~/composables/gql/graphql';

const props = defineProps<NotificationFragmentFragment>();

const { t } = useI18n();

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
  <div class="group/item relative flex flex-col gap-2 py-3 text-base">
    <header class="flex -translate-y-1 flex-row items-baseline justify-between gap-2">
      <h3
        class="m-0 flex flex-row items-baseline gap-2 overflow-x-hidden text-base font-semibold normal-case"
      >
        <!-- the `translate` compensates for extra space added by the `svg` element when rendered -->
        <component
          :is="icon.component"
          v-if="icon"
          class="size-5 shrink-0 translate-y-1"
          :class="icon.color"
        />
        <span class="flex-1 truncate" :title="title">{{ title }}</span>
      </h3>

      <div
        class="mt-1 flex shrink-0 flex-row items-baseline justify-end gap-2"
        :title="formattedTimestamp ?? reformattedTimestamp"
      >
        <p class="text-secondary-foreground text-sm">{{ reformattedTimestamp }}</p>
      </div>
    </header>

    <h4 class="m-0 font-normal">
      {{ subject }}
    </h4>

    <div class="flex flex-row items-center justify-between gap-2">
      <div class="" v-html="descriptionMarkup" />
    </div>

    <p v-if="mutationError" class="text-red-600">{{ t('common.error') }}: {{ mutationError }}</p>

    <div class="flex items-baseline justify-end gap-4">
      <a
        v-if="link"
        :href="link"
        class="text-primary inline-flex items-center justify-center text-sm font-medium hover:underline focus:underline"
      >
        <LinkIcon class="mr-2 size-4" />
        <span class="text-sm">{{ t('notifications.item.viewLink') }}</span>
      </a>
      <Button
        v-if="type === NotificationType.UNREAD"
        :disabled="archive.loading"
        @click="() => archive.mutate({ id: props.id })"
      >
        <ArchiveBoxIcon class="mr-2 size-4" />
        <span class="text-sm">{{ t('notifications.item.archive') }}</span>
      </Button>
      <Button
        :disabled="deleteNotification.loading"
        @click="() => deleteNotification.mutate({ id: props.id, type: props.type })"
      >
        <TrashIcon class="mr-2 size-4" />
        <span class="text-sm">{{ t('notifications.item.delete') }}</span>
      </Button>
    </div>
  </div>
</template>
