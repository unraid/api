<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@vue/apollo-composable';
import { vInfiniteScroll } from '@vueuse/components';

import { CheckIcon } from '@heroicons/vue/24/solid';

import type { NotificationImportance as Importance, NotificationType } from '~/composables/gql/graphql';

import {
  getNotifications,
  NOTIFICATION_FRAGMENT,
} from '~/components/Notifications/graphql/notification.query';
import NotificationsItem from '~/components/Notifications/Item.vue';
import { useHaveSeenNotifications } from '~/composables/api/use-notifications';
import { useFragment } from '~/composables/gql/fragment-masking';
import { useUnraidApiStore } from '~/store/unraidApi';

/**
 * Page size is the max amount of items fetched from the api in a single request.
 */
const props = withDefaults(
  defineProps<{
    type: NotificationType;
    pageSize?: number;
    importance?: Importance;
  }>(),
  {
    pageSize: 15,
    importance: undefined,
  }
);

/** whether we should continue trying to load more notifications */
const canLoadMore = ref(true);
/** reset custom state when props (e.g. props.type filter) change*/
watch(props, () => {
  canLoadMore.value = true;
});

const { offlineError } = useUnraidApiStore();
const { result, error, loading, fetchMore, refetch } = useQuery(getNotifications, () => ({
  filter: {
    offset: 0,
    limit: props.pageSize,
    type: props.type,
    importance: props.importance,
  },
}));

const notifications = computed(() => {
  if (!result.value?.notifications.list) return [];
  const list = useFragment(NOTIFICATION_FRAGMENT, result.value?.notifications.list);
  // necessary because some items in this list may change their type (e.g. archival)
  // and we don't want to display them in the wrong list client-side.
  return list.filter((n) => n.type === props.type);
});

const { t } = useI18n();

// saves timestamp of latest visible notification to local storage
const { latestSeenTimestamp } = useHaveSeenNotifications();
watch(
  notifications,
  () => {
    const [latest] = notifications.value;
    if (!latest?.timestamp) return;
    if (new Date(latest.timestamp) > new Date(latestSeenTimestamp.value)) {
      console.log('[notif list] setting last seen timestamp', latest.timestamp);
      latestSeenTimestamp.value = latest.timestamp;
    }
  },
  { immediate: true }
);

async function onLoadMore() {
  console.log('[getNotifications] onLoadMore');
  const incoming = await fetchMore({
    variables: {
      filter: {
        offset: notifications.value.length,
        limit: props.pageSize,
        type: props.type,
        importance: props.importance,
      },
    },
  });
  const incomingCount = incoming?.data.notifications.list.length ?? 0;
  if (incomingCount === 0 || incomingCount < props.pageSize) {
    canLoadMore.value = false;
  }
}

const importanceLabel = computed(() => {
  switch (props.importance) {
    case 'ALERT':
      return t('notifications.importance.alert');
    case 'WARNING':
      return t('notifications.importance.warning');
    case 'INFO':
      return t('notifications.importance.info');
    default:
      return '';
  }
});

const noNotificationsMessage = computed(() => {
  if (!props.importance) {
    return t('notifications.list.noNotifications');
  }
  return t('notifications.list.noNotificationsWithImportance', {
    importance: importanceLabel.value.toLowerCase(),
  });
});
</script>

<template>
  <div
    v-if="notifications?.length > 0"
    v-infinite-scroll="[onLoadMore, { canLoadMore: () => canLoadMore }]"
    class="flex min-h-0 flex-1 flex-col overflow-y-scroll px-3"
  >
    <TransitionGroup
      name="notification-list"
      tag="div"
      class="divide-y"
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-300 ease-in absolute right-0 left-0"
      enter-from-class="opacity-0 -translate-x-4"
      leave-to-class="opacity-0 translate-x-4"
      move-class="transition-transform duration-300"
    >
      <NotificationsItem
        v-for="notification in notifications"
        :key="notification.id"
        v-bind="notification"
      />
    </TransitionGroup>
    <div v-if="loading" class="grid place-content-center py-3">
      <!-- 3 skeletons to replace shadcn's LoadingSpinner -->
      <div v-if="loading" class="space-y-4 py-3">
        <div v-for="n in 3" :key="n" class="py-3">
          <div class="flex items-center gap-2">
            <USkeleton class="h-5 w-5 rounded-full" />
            <USkeleton class="h-4 w-40" />
            <div class="ml-auto">
              <USkeleton class="h-3 w-24" />
            </div>
          </div>
          <div class="mt-2">
            <USkeleton class="h-3 w-3/4" />
          </div>
        </div>
      </div>
    </div>
    <div v-if="!canLoadMore" class="text-secondary-foreground grid place-content-center py-3">
      {{ t('notifications.list.reachedEnd') }}
    </div>
  </div>

  <!-- nextui replacement for LoadingError -->
  <div v-else class="flex h-full flex-col items-center justify-center gap-3 px-3">
    <!-- Loading (centered, like LoadingError) -->
    <div v-if="loading" class="w-full max-w-md space-y-4">
      <div v-for="n in 3" :key="n" class="py-1.5">
        <div class="flex items-center gap-2">
          <USkeleton class="h-5 w-5 rounded-full" />
          <USkeleton class="h-4 w-40" />
        </div>
        <div class="mt-2">
          <USkeleton class="h-3 w-3/4" />
        </div>
      </div>
      <p class="text-muted-foreground text-center text-sm">Loading Notifications...</p>
    </div>

    <!-- Error (centered, icon + title + message + full-width button) -->
    <div v-else-if="offlineError || error" class="w-full max-w-sm space-y-3">
      <div class="flex justify-center">
        <UIcon name="i-heroicons-shield-exclamation-20-solid" class="size-10 text-red-600" />
      </div>
      <div class="text-center">
        <h3 class="font-bold">Error</h3>
        <p>{{ (offlineError ?? error)?.message }}</p>
      </div>
      <UButton class="w-full" @click="() => void refetch()">Try Again</UButton>
    </div>

    <!-- Default (empty state) -->
    <div v-else class="contents">
      <CheckIcon class="h-10 translate-y-3 text-green-600" />
      {{ noNotificationsMessage }}
    </div>
  </div>
</template>
