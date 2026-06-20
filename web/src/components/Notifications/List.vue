<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@vue/apollo-composable';
import { vInfiniteScroll } from '@vueuse/components';

import { CheckIcon } from '@heroicons/vue/24/solid';
import { Error as LoadingError, Spinner as LoadingSpinner } from '@unraid/ui';

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
    showPinned?: boolean;
  }>(),
  {
    pageSize: 15,
    importance: undefined,
    showPinned: true,
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

// Persistent (condition-style) notifications stick to the top of the list.
// Display-only sort (stable, so within each group the API's latest-first order
// is preserved); the seen-tracking watcher below intentionally uses the
// unsorted `notifications` so it still keys off the genuinely latest item.
// The "Pinned" filter can hide persistent items entirely.
const displayNotifications = computed(() =>
  [...notifications.value]
    .filter((n) => props.showPinned || !n.persistent)
    .sort((a, b) => Number(b.persistent ?? false) - Number(a.persistent ?? false))
);

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

// Dismiss/leave animation: the card slides out to the right while collapsing its
// own vertical space (height + margins + padding + borders), so the cards below
// flow up as a single continuous motion instead of jumping after the fact.
const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function onLeave(el: Element, done: () => void) {
  const node = el as HTMLElement;
  if (prefersReducedMotion) {
    done();
    return;
  }
  const cs = getComputedStyle(node);
  node.style.overflow = 'hidden';
  node.style.boxSizing = 'border-box';
  const animation = node.animate(
    [
      {
        opacity: 1,
        transform: 'translateX(0)',
        height: `${node.offsetHeight}px`,
        marginTop: cs.marginTop,
        marginBottom: cs.marginBottom,
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        borderTopWidth: cs.borderTopWidth,
        borderBottomWidth: cs.borderBottomWidth,
      },
      { opacity: 0, transform: 'translateX(2rem)', offset: 0.55 },
      {
        opacity: 0,
        transform: 'translateX(2rem)',
        height: '0px',
        marginTop: '0px',
        marginBottom: '0px',
        paddingTop: '0px',
        paddingBottom: '0px',
        borderTopWidth: '0px',
        borderBottomWidth: '0px',
      },
    ],
    { duration: 340, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
  );
  animation.onfinish = done;
  animation.oncancel = done;
}

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
    v-if="displayNotifications.length > 0"
    v-infinite-scroll="[onLoadMore, { canLoadMore: () => canLoadMore }]"
    class="flex min-h-0 flex-1 flex-col overflow-y-scroll px-4"
  >
    <TransitionGroup name="notification-list" tag="div" class="flex flex-col" @leave="onLeave">
      <NotificationsItem
        v-for="notification in displayNotifications"
        :key="notification.id"
        v-bind="notification"
      />
    </TransitionGroup>
    <div v-if="loading" class="grid place-content-center py-3">
      <LoadingSpinner />
    </div>
    <div v-if="!canLoadMore" class="text-secondary-foreground grid place-content-center py-3">
      {{ t('notifications.list.reachedEnd') }}
    </div>
  </div>

  <LoadingError v-else :loading="loading" :error="offlineError ?? error" @retry="refetch">
    <div v-if="displayNotifications.length === 0" class="contents">
      <CheckIcon class="h-10 translate-y-3 text-green-600" />
      {{ noNotificationsMessage }}
    </div>
  </LoadingError>
</template>

<style scoped>
/* New items ease in; reorders (e.g. a pinned item moving to the top) glide via
   FLIP. The dismiss/leave animation is handled in JS (onLeave) so the card can
   slide out AND collapse its own space in one continuous motion. */
.notification-list-move,
.notification-list-enter-active {
  transition:
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.notification-list-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .notification-list-move,
  .notification-list-enter-active {
    transition: none;
  }
}
</style>
