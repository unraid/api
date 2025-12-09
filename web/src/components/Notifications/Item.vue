<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation } from '@vue/apollo-composable';
import { computedAsync } from '@vueuse/core';

import { Markdown } from '@/helpers/markdown';

import type { NotificationFragmentFragment } from '~/composables/gql/graphql';

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

const icon = computed<{ name: string; color: string } | null>(() => {
  switch (props.importance) {
    case 'INFO':
      return {
        name: 'i-heroicons-check-badge-20-solid',
        color: 'text-unraid-green',
      };
    case 'WARNING':
      return {
        name: 'i-heroicons-exclamation-triangle-20-solid',
        color: 'text-yellow-accent',
      };
    case 'ALERT':
      return {
        name: 'i-heroicons-shield-exclamation-20-solid',
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

const openLink = () => {
  if (props.link) {
    window.location.assign(props.link);
  }
};

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
        <UIcon v-if="icon" :name="icon.name" class="size-5 shrink-0 translate-y-1" :class="icon.color" />
        <span class="flex-1 break-words" :title="title">{{ title }}</span>
      </h3>

      <div
        class="mt-1 flex shrink-0 flex-row items-baseline justify-end gap-2"
        :title="formattedTimestamp ?? reformattedTimestamp"
      >
        <p class="text-secondary-foreground text-sm">{{ reformattedTimestamp }}</p>
      </div>
    </header>

    <h4 class="m-0 font-normal break-words">
      {{ subject }}
    </h4>

    <div class="flex flex-row items-center justify-between gap-2">
      <div class="min-w-0 break-words" v-html="descriptionMarkup" />
    </div>

    <p v-if="mutationError" class="text-destructive">{{ t('common.error') }}: {{ mutationError }}</p>

    <div class="flex items-baseline justify-end gap-4">
      <UButton
        v-if="link"
        variant="link"
        icon="i-heroicons-link-20-solid"
        color="neutral"
        @click="openLink"
      >
        {{ t('notifications.item.viewLink') }}
      </UButton>
      <UButton
        v-if="type === NotificationType.UNREAD"
        :loading="archive.loading"
        icon="i-heroicons-archive-box-20-solid"
        @click="() => void archive.mutate({ id: props.id })"
      >
        {{ t('notifications.item.archive') }}
      </UButton>
      <UButton
        v-if="type === NotificationType.ARCHIVE"
        :loading="deleteNotification.loading"
        icon="i-heroicons-trash-20-solid"
        @click="() => void deleteNotification.mutate({ id: props.id, type: props.type })"
      >
        {{ t('notifications.item.delete') }}
      </UButton>
    </div>
  </div>
</template>
