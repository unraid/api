<script setup lang="ts">
import {
  getNotifications,
  NOTIFICATION_FRAGMENT,
} from "./graphql/notification.query";
import type { Importance, NotificationType } from "~/composables/gql/graphql";
import { useFragment } from "~/composables/gql/fragment-masking";
import { useQuery } from "@vue/apollo-composable";
import { vInfiniteScroll } from "@vueuse/components";
import { CheckIcon } from "@heroicons/vue/24/solid";

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

const { result, error, fetchMore } = useQuery(getNotifications, () => ({
  filter: {
    offset: 0,
    limit: props.pageSize,
    type: props.type,
    importance: props.importance,
  },
}));

watch(error, (newVal) => {
  console.log("[getNotifications] error:", newVal);
});

const notifications = computed(() => {
  if (!result.value?.notifications.list) return [];
  const list = useFragment(
    NOTIFICATION_FRAGMENT,
    result.value?.notifications.list
  );
  // necessary because some items in this list may change their type (e.g. archival)
  // and we don't want to display them in the wrong list client-side.
  return list.filter((n) => n.type === props.type);
});

async function onLoadMore() {
  console.log("[getNotifications] onLoadMore");
  void fetchMore({
    variables: {
      filter: {
        offset: notifications.value.length,
        limit: props.pageSize,
        type: props.type,
        importance: props.importance,
      },
    },
  });
}
</script>

<template>
  <div
    v-if="notifications?.length === 0"
    class="h-full flex flex-col items-center justify-center gap-3"
  >
    <CheckIcon class="h-10 text-green-600" />
    {{
      `No ${props.importance?.toLowerCase() ?? ""} notifications to see here!`
    }}
  </div>
  <!-- The horizontal padding here adjusts for the scrollbar offset -->
  <div
    v-if="notifications?.length > 0"
    v-infinite-scroll="onLoadMore"
    class="divide-y divide-gray-200 overflow-y-auto pl-7 pr-4 h-full"
  >
    <NotificationsItem
      v-for="notification in notifications"
      :key="notification.id"
      v-bind="notification"
    />
  </div>
</template>
