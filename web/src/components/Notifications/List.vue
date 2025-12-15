<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import { vInfiniteScroll } from '@vueuse/components';
import { useDebounceFn } from '@vueuse/core';

import type { ApolloError } from '@apollo/client/errors';
import type {
  NotificationImportance as Importance,
  Notification,
  NotificationType,
} from '~/composables/gql/graphql';
import type { GraphQLError } from 'graphql';

import {
  getNotifications,
  NOTIFICATION_FRAGMENT,
} from '~/components/Notifications/graphql/notification.query';
import { notificationAddedSubscription } from '~/components/Notifications/graphql/notification.subscription';
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
    // Increased to 50 to minimize "pagination drift" (race conditions) where
    // new items added during a fetch shift the offsets of subsequent pages,
    // causing the client to fetch duplicate items it already has.
    pageSize: 50,
    importance: undefined,
  }
);

/** whether we should continue trying to load more notifications */
const canLoadMore = ref(true);
/** reset custom state when props (e.g. props.type filter) change*/
watch(props, () => {
  canLoadMore.value = true;
});

const unraidApiStore = useUnraidApiStore();
const { offlineError } = storeToRefs(unraidApiStore);

const { result, error, loading, fetchMore, refetch, subscribeToMore } = useQuery(
  getNotifications,
  () => ({
    filter: {
      offset: 0,
      limit: props.pageSize,
      type: props.type,
      importance: props.importance,
    },
  })
);

// Debounce refetch to handle mass-add scenarios efficiently.
// Increased to 500ms to ensure we capture the entire batch of events in a single refetch,
// preventing partial updates that can lead to race conditions.
const debouncedRefetch = useDebounceFn(() => {
  console.log('[Notifications] Refetching due to subscription update');
  canLoadMore.value = true; // Reset load state so infinite scroll works again from top
  void refetch();
}, 500);

subscribeToMore({
  document: notificationAddedSubscription,
  updateQuery: (previousResult, { subscriptionData }) => {
    if (!subscriptionData.data) return previousResult;

    const newNotification = subscriptionData.data.notificationAdded;

    // Check filters - only refetch if the new notification is relevant to this list
    let isRelevant = newNotification.type === props.type;
    if (isRelevant && props.importance) {
      isRelevant = newNotification.importance === props.importance;
    }

    if (isRelevant) {
      // Debug log to confirm event reception
      console.log('[Notifications] Relevant subscription event received:', newNotification.id);
      debouncedRefetch();
    } else {
      // console.log('[Notifications] Irrelevant subscription event ignored:', newNotification.id);
    }

    // Return previous result unchanged. We rely on refetch() to update the list.
    // This avoids the "stale previousResult" issue where rapid updates overwrite each other.
    return previousResult;
  },
});

function dbgApolloError(prefix: string, err: ApolloError | null | undefined) {
  if (!err) return;
  console.group(`[Notifications] ${prefix}`);
  console.log('top message:', err.message);
  console.log('graphQLErrors:', err.graphQLErrors);
  console.log('networkError:', err.networkError);
  try {
    console.log('json:', JSON.parse(JSON.stringify(err)));
  } catch {
    console.log('json:', 'failed to parse');
    console.log('json:', err);
  }
  console.groupEnd();
}

watch(error, (e) => dbgApolloError('useQuery error', e as ApolloError | null | undefined), {
  immediate: true,
});
watch(offlineError, (o) => {
  if (o) console.log('[Notifications] offlineError:', o.message);
});

watch([error, offlineError], ([e, o]) => {
  if (!e && !o) {
    canLoadMore.value = true;
  } else if (o) {
    canLoadMore.value = false;
  }
});

const notifications = computed(() => {
  if (!result.value?.notifications.list) return [];
  const list = useFragment(NOTIFICATION_FRAGMENT, result.value?.notifications.list);
  const filtered = list.filter((n) => n.type === props.type);
  console.log('[Notifications] Computed list updated. Length:', filtered.length);
  return filtered;
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
      // console.log('[notif list] setting last seen timestamp', latest.timestamp);
      latestSeenTimestamp.value = latest.timestamp;
    }
  },
  { immediate: true }
);

async function onLoadMore() {
  const currentLength = notifications.value.length;
  console.log('[Notifications] onLoadMore triggered. Current Offset:', currentLength);

  if (loading.value) {
    console.log('[Notifications] Skipping load more because loading is true');
    return;
  }

  try {
    const incoming = await fetchMore({
      variables: {
        filter: {
          offset: currentLength,
          limit: props.pageSize,
          type: props.type,
          importance: props.importance,
        },
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        if (!fetchMoreResult) return previousResult;

        const currentList = previousResult.notifications.list || [];
        const incomingList = fetchMoreResult.notifications.list;

        console.log('[Notifications] fetchMore UpdateQuery.');
        console.log(' - Previous List Length:', currentList.length);
        console.log(' - Incoming List Length:', incomingList.length);

        const existingIds = new Set(currentList.map((n: Notification) => n.id));
        const newUniqueItems = incomingList.filter((n: Notification) => !existingIds.has(n.id));

        console.log(' - Unique Items to Append:', newUniqueItems.length);

        // DETECT PAGINATION DRIFT (Shifted Offsets)
        // If we fetched items, but they are ALL duplicates, it implies new items were added
        // to the top of the list, pushing existing items down into our requested page range.
        // In this case, our current list is stale/misaligned. We must force a full refetch.
        if (incomingList.length > 0 && newUniqueItems.length === 0) {
          console.warn(
            '[Notifications] Pagination Drift Detected! Fetched items are all duplicates. Triggering Refetch.'
          );
          // Trigger refetch asynchronously to avoid side-effects during render cycle
          setTimeout(() => {
            debouncedRefetch();
          }, 0);
          return previousResult;
        }

        return {
          ...previousResult,
          notifications: {
            ...previousResult.notifications,
            list: [...currentList, ...newUniqueItems],
          },
        };
      },
    });

    const incomingCount = incoming?.data.notifications.list.length ?? 0;
    console.log('[Notifications] fetchMore Result.');
    console.log(' - Incoming Count from Network:', incomingCount);
    console.log(' - Page Size:', props.pageSize);

    if (incomingCount === 0 || incomingCount < props.pageSize) {
      console.log('[Notifications] Reached End (incoming < pageSize). Disabling Infinite Scroll.');
      canLoadMore.value = false;
    }
  } catch (error) {
    console.error('[Notifications] fetchMore Error:', error);
    canLoadMore.value = false;
    throw error;
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

const displayErrorMessage = computed(() => {
  if (offlineError.value) return offlineError.value.message;

  const apolloErr = error.value as ApolloError | null | undefined;
  const firstGqlErr = apolloErr?.graphQLErrors?.[0] as
    | (GraphQLError & {
        extensions?: { error?: { message?: string } };
        error?: { message?: string };
      })
    | undefined;

  const gqlEmbedded = firstGqlErr?.extensions?.error?.message;
  const gqlTop = firstGqlErr?.error?.message;
  const gqlMessage = firstGqlErr?.message;
  const netMessage = (apolloErr?.networkError as { message?: string } | undefined)?.message;
  const topMessage = apolloErr?.message;

  return gqlEmbedded || gqlTop || gqlMessage || netMessage || topMessage || 'An unknown error occurred.';
});
</script>

<template>
  <div
    v-if="notifications?.length > 0"
    v-infinite-scroll="[onLoadMore, { canLoadMore: () => canLoadMore && !loading && !offlineError }]"
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
            <USkeleton class="size-5 rounded-full" />
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

  <!-- USkeleton for loading and error states -->
  <div v-else class="flex h-full flex-col items-center justify-center gap-3 px-3">
    <div v-if="loading" class="w-full max-w-md space-y-4">
      <div v-for="n in 3" :key="n" class="py-1.5">
        <div class="flex items-center gap-2">
          <USkeleton class="size-5 rounded-full" />
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
        <UIcon name="i-heroicons-shield-exclamation-20-solid" class="text-destructive size-10" />
      </div>
      <div class="text-center">
        <h3 class="font-bold">Error</h3>
        <p>{{ displayErrorMessage }}</p>
      </div>
      <UButton class="w-full" @click="() => void refetch()">Try Again</UButton>
    </div>

    <!-- Default (empty state) -->
    <div v-else class="contents">
      <UIcon name="i-heroicons-check-20-solid" class="text-unraid-green size-10 translate-y-3" />
      {{ noNotificationsMessage }}
    </div>
  </div>
</template>
