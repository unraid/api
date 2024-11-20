<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/24/solid';
import { useQuery } from '@vue/apollo-composable';
import { vInfiniteScroll } from '@vueuse/components';
import { useFragment } from '~/composables/gql/fragment-masking';
import { type Importance, type NotificationType } from '~/composables/gql/graphql';
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

/** whether we should load more notifications */
const canLoadMore = ref(true);
/** reset when props (e.g. props.type filter) change*/
watch(props, () => {
  canLoadMore.value = true;
});

const { result, error, fetchMore } = useQuery(getNotifications, () => ({
  filter: {
    offset: 0,
    limit: props.pageSize,
    type: props.type,
    importance: props.importance,
  },
}));

watch(error, (newVal) => {
  console.log('[NotificationsList] getNotifications error:', newVal);
});

const notifications = computed(() => {
  if (!result.value?.notifications.list) return [];
  const list = useFragment(NOTIFICATION_FRAGMENT, result.value?.notifications.list);
  // necessary because some items in this list may change their type (e.g. archival)
  // and we don't want to display them in the wrong list client-side.
  return list.filter((n) => n.type === props.type);
});

/** notifications grouped by importance/severity */
const notificationGroups = computed(() => {
  return Object.groupBy(notifications.value, ({ importance }) => importance);
});

async function onLoadMore() {
  console.log('[NotificationsList] onLoadMore');
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
  <div v-if="notifications?.length === 0" class="h-full flex flex-col items-center justify-center gap-3">
    <CheckIcon class="h-10 text-green-600" />
    {{ `No ${props.importance?.toLowerCase() ?? ''} notifications to see here!` }}
  </div>
  <!-- The horizontal padding here adjusts for the scrollbar offset -->
  <div
    v-if="notifications?.length > 0"
    v-infinite-scroll="[onLoadMore, { canLoadMore: () => canLoadMore }]"
    class="divide-y divide-gray-200 overflow-y-auto pl-7 pr-4 h-full"
  >
    <NotificationsItem
      v-for="notification in notificationGroups.ALERT"
      :key="notification.id"
      v-bind="notification"
    />
    <NotificationsItem
      v-for="notification in notificationGroups.WARNING"
      :key="notification.id"
      v-bind="notification"
    />
    <NotificationsItem
      v-for="notification in notificationGroups.INFO"
      :key="notification.id"
      v-bind="notification"
    />
  </div>
</template>
