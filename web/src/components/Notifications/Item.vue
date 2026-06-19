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
  XMarkIcon,
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
import { useConfirm } from '~/composables/useConfirm';

const props = defineProps<NotificationFragmentFragment>();

const { t } = useI18n();
const { confirm } = useConfirm();

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

// Persistent notifications are pinned and not dismissed casually. Dismissing is
// allowed but gated behind a warning: it only hides the reminder (acknowledge),
// it does not resolve the underlying condition, which may re-pin if raised again.
const dismissPersistent = async () => {
  const confirmed = await confirm({
    title: t('notifications.item.confirmDismiss.title'),
    description: t('notifications.item.confirmDismiss.description'),
    confirmText: t('notifications.item.confirmDismiss.confirmText'),
    confirmVariant: 'primary',
  });
  if (confirmed) {
    await archive.mutate({ id: props.id });
  }
};

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
  <div
    class="group/item relative my-1.5 flex flex-col gap-1.5 rounded-md border px-3 py-2.5 text-sm transition-colors"
    :class="
      persistent
        ? 'border-l-4 border-orange-300/70 border-l-orange-500 bg-orange-50/70 dark:border-orange-500/30 dark:border-l-orange-500 dark:bg-orange-500/10'
        : 'border-border/60 bg-muted/20 hover:bg-muted/40'
    "
  >
    <header class="flex flex-row items-baseline justify-between gap-2">
      <h3
        class="m-0 flex flex-row items-baseline gap-2 overflow-x-hidden text-sm font-semibold normal-case"
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
        class="flex shrink-0 flex-row items-baseline justify-end gap-2"
        :title="formattedTimestamp ?? reformattedTimestamp"
      >
        <span
          v-if="persistent"
          class="inline-flex items-center gap-1 self-center rounded-full border border-orange-300 bg-orange-100 px-2 py-0.5 text-[1rem] font-semibold tracking-wide text-orange-700 uppercase dark:border-orange-500/40 dark:bg-orange-500/20 dark:text-orange-200"
        >
          {{ t('notifications.item.pinned') }}
        </span>
        <p class="text-secondary-foreground text-xs whitespace-nowrap">{{ reformattedTimestamp }}</p>
      </div>
    </header>

    <h4 class="m-0 text-sm font-normal">
      {{ subject }}
    </h4>

    <div
      class="text-secondary-foreground flex flex-row items-center justify-between gap-2 text-sm leading-snug"
    >
      <div v-html="descriptionMarkup" />
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
        v-if="type === NotificationType.UNREAD && !persistent"
        :disabled="archive.loading"
        @click="() => archive.mutate({ id: props.id })"
      >
        <ArchiveBoxIcon class="mr-2 size-4" />
        <span class="text-sm">{{ t('notifications.item.archive') }}</span>
      </Button>
      <Button
        v-if="type === NotificationType.UNREAD && persistent"
        variant="ghost"
        size="sm"
        class="text-secondary-foreground"
        :disabled="archive.loading"
        @click="dismissPersistent"
      >
        <XMarkIcon class="mr-2 size-4" />
        <span class="text-sm">{{ t('notifications.item.dismiss') }}</span>
      </Button>
      <Button
        v-if="type === NotificationType.ARCHIVE"
        :disabled="deleteNotification.loading"
        @click="() => deleteNotification.mutate({ id: props.id, type: props.type })"
      >
        <TrashIcon class="mr-2 size-4" />
        <span class="text-sm">{{ t('notifications.item.delete') }}</span>
      </Button>
    </div>
  </div>
</template>
