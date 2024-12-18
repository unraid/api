<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/24/solid';
import { useQuery } from '@vue/apollo-composable';
import { vInfiniteScroll } from '@vueuse/components';
import { useFragment } from '~/composables/gql/fragment-masking';
import type { Importance, NotificationType } from '~/composables/gql/graphql';
import { useUnraidApiStore } from '~/store/unraidApi';
import { getNotifications, NOTIFICATION_FRAGMENT } from './graphql/notification.query';

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
</script>

<template>
  <!-- The horizontal padding here adjusts for the scrollbar offset -->
  <div
    v-if="notifications?.length > 0"
    v-infinite-scroll="[onLoadMore, { canLoadMore: () => canLoadMore }]"
    class="divide-y divide-gray-200 overflow-y-auto h-full pl-7"
  >
    <NotificationsItem
      v-for="notification in notifications"
      :key="notification.id"
      v-bind="notification"
    />
    <div v-if="loading" class="py-5 grid place-content-center">
      <LoadingSpinner />
    </div>
  </div>

  <LoadingError v-else :loading="loading" :error="offlineError ?? error" @retry="refetch">
    <div v-if="notifications?.length === 0" class="contents">
      <CheckIcon class="h-10 text-green-600 translate-y-3" />
      {{ `No ${props.importance?.toLowerCase() ?? ''} notifications to see here!` }}
    </div>
  </LoadingError>
</template>
