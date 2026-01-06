<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation } from '@vue/apollo-composable';
import { computedAsync, useTimeAgo } from '@vueuse/core';

import { Markdown } from '@/helpers/markdown';
import { navigate } from '~/helpers/external-navigation';

import type { NotificationFragmentFragment } from '~/composables/gql/graphql';

import { NOTIFICATION_COLORS, NOTIFICATION_ICONS } from '~/components/Notifications/constants';
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
  if (!props.importance || !NOTIFICATION_ICONS[props.importance]) {
    return null;
  }

  return {
    name: NOTIFICATION_ICONS[props.importance],
    color: NOTIFICATION_COLORS[props.importance],
  };
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
    navigate(props.link);
  }
};

const reformattedTimestamp = computed<string>(() => {
  if (!props.timestamp) return '';
  const userLocale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

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

const rawDisplayTimestamp = computed(() => props.formattedTimestamp || reformattedTimestamp.value);

const parsedTimestamp = computed(() => {
  const full = rawDisplayTimestamp.value;
  // Try to find a time pattern at the end of the string: HH:MM or HH:MM AA
  const timeMatch = full.match(/(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)$/);

  if (timeMatch) {
    const time = timeMatch[0];
    const date = full.replace(time, '').trim();
    return { date, time, split: true };
  }

  return { date: full, time: '', split: false };
});

const timeAgoReference = useTimeAgo(computed(() => props.timestamp ?? new Date()));
const timeAgo = computed(() => (props.timestamp ? timeAgoReference.value : ''));
</script>

<template>
  <div
    class="group/item border-default relative flex flex-col gap-3 border-b py-4 text-base last:border-0 sm:gap-4"
  >
    <div class="flex items-start gap-4">
      <!-- Icon -->
      <UIcon v-if="icon" :name="icon.name" class="mt-0.5 size-6 shrink-0" :class="icon.color" />

      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <!-- Timestamp Row -->
        <div class="mb-0.5 flex flex-wrap items-center gap-x-2 text-xs font-medium tabular-nums">
          <span class="text-muted" :title="rawDisplayTimestamp">
            <template v-if="parsedTimestamp.split">
              {{ parsedTimestamp.date }} at {{ parsedTimestamp.time }}
            </template>
            <template v-else>
              {{ rawDisplayTimestamp }}
            </template>
          </span>

          <template v-if="timeAgo">
            <span class="text-muted/50">&bull;</span>

            <span class="text-primary">
              {{ timeAgo }}
            </span>
          </template>
        </div>

        <!-- Title -->
        <h3 class="text-default pr-2 text-base leading-tight font-semibold break-words">
          {{ title }}
        </h3>

        <!-- Subject -->
        <p class="text-muted mb-1 text-sm font-medium break-words">
          {{ subject }}
        </p>

        <!-- Description -->
        <div class="prose prose-sm dark:prose-invert text-dimmed max-w-none text-sm break-words">
          <div v-html="descriptionMarkup" />
        </div>

        <!-- Error Message -->
        <p v-if="mutationError" class="text-destructive mt-2 text-sm">
          {{ t('common.error') }}: {{ mutationError }}
        </p>

        <!-- Actions -->
        <div class="mt-2 flex flex-wrap items-center justify-end gap-2">
          <UButton
            v-if="link"
            size="xs"
            variant="ghost"
            icon="i-heroicons-link-20-solid"
            color="gray"
            @click="openLink"
          >
            {{ t('notifications.item.viewLink') }}
          </UButton>
          <UButton
            v-if="type === NotificationType.UNREAD"
            size="xs"
            variant="soft"
            :loading="archive.loading"
            icon="i-heroicons-archive-box-20-solid"
            color="primary"
            @click="() => void archive.mutate({ id: props.id })"
          >
            {{ t('notifications.item.archive') }}
          </UButton>
          <UButton
            v-if="type === NotificationType.ARCHIVE"
            size="xs"
            variant="soft"
            :loading="deleteNotification.loading"
            icon="i-heroicons-trash-20-solid"
            color="red"
            @click="() => void deleteNotification.mutate({ id: props.id, type: props.type })"
          >
            {{ t('notifications.item.delete') }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
