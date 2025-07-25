<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQuery, useSubscription } from '@vue/apollo-composable';

import {
  Button,
  Select,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@unraid/ui';

import { useTrackLatestSeenNotification } from '~/composables/api/use-notifications';
import { useFragment } from '~/composables/gql';
import { NotificationImportance as Importance, NotificationType } from '~/composables/gql/graphql';
import {
  archiveAllNotifications,
  deleteArchivedNotifications,
  NOTIFICATION_FRAGMENT,
  notificationsOverview,
  resetOverview,
} from './graphql/notification.query';
import {
  notificationAddedSubscription,
  notificationOverviewSubscription,
} from './graphql/notification.subscription';
import NotificationsIndicator from './Indicator.vue';
import NotificationsList from './List.vue';

const { mutate: archiveAll, loading: loadingArchiveAll } = useMutation(archiveAllNotifications);
const { mutate: deleteArchives, loading: loadingDeleteAll } = useMutation(deleteArchivedNotifications);
const { mutate: recalculateOverview } = useMutation(resetOverview);
const importance = ref<Importance | undefined>(undefined);

const filterItems = [
  { type: 'label' as const, label: 'Notification Types' },
  { label: 'All Types', value: 'all' },
  { label: 'Alert', value: Importance.ALERT },
  { label: 'Info', value: Importance.INFO },
  { label: 'Warning', value: Importance.WARNING },
];

const confirmAndArchiveAll = async () => {
  if (confirm('This will archive all notifications on your Unraid server. Continue?')) {
    await archiveAll();
  }
};

const confirmAndDeleteArchives = async () => {
  if (
    confirm(
      'This will permanently delete all archived notifications currently on your Unraid server. Continue?'
    )
  ) {
    await deleteArchives();
  }
};

const { result, subscribeToMore } = useQuery(notificationsOverview);
subscribeToMore({
  document: notificationOverviewSubscription,
  updateQuery: (prev, { subscriptionData }) => {
    const snapshot = structuredClone(prev);
    snapshot.notifications.overview = subscriptionData.data.notificationsOverview;
    return snapshot;
  },
});
const { latestNotificationTimestamp, haveSeenNotifications } = useTrackLatestSeenNotification();
const { onResult: onNotificationAdded } = useSubscription(notificationAddedSubscription);

onNotificationAdded(({ data }) => {
  if (!data) return;
  const notif = useFragment(NOTIFICATION_FRAGMENT, data.notificationAdded);
  if (notif.type !== NotificationType.UNREAD) return;

  if (notif.timestamp) {
    latestNotificationTimestamp.value = notif.timestamp;
  }
  // probably smart to leave this log outside the if-block for the initial release
  console.log('incoming notification', notif);
  if (!globalThis.toast) {
    return;
  }

  const funcMapping: Record<Importance, (typeof globalThis)['toast']['info' | 'error' | 'warning']> = {
    [Importance.ALERT]: globalThis.toast.error,
    [Importance.WARNING]: globalThis.toast.warning,
    [Importance.INFO]: globalThis.toast.info,
  };
  const toast = funcMapping[notif.importance];
  const createOpener = () => ({ label: 'Open', onClick: () => location.assign(notif.link as string) });

  requestAnimationFrame(() =>
    toast(notif.title, {
      description: notif.subject,
      action: notif.link ? createOpener() : undefined,
    })
  );
});

const overview = computed(() => {
  if (!result.value) {
    return;
  }
  return result.value.notifications.overview;
});

/** This recalculates the archived count due to notifications going to archived + unread when they are in an Unread state. */
const readArchivedCount = computed(() => {
  if (!overview.value) return 0;
  const { archive, unread } = overview.value;
  return Math.max(0, archive.total - unread.total);
});

const prepareToViewNotifications = () => {
  void recalculateOverview();
};
</script>

<template>
  <Sheet>
    <SheetTrigger @click="prepareToViewNotifications">
      <span class="sr-only">Notifications</span>
      <NotificationsIndicator :overview="overview" :seen="haveSeenNotifications" />
    </SheetTrigger>
    <SheetContent
      side="right"
      class="w-full max-w-screen sm:max-w-[540px] max-h-screen h-screen min-h-screen px-0 flex flex-col gap-5 pb-0"
    >
      <div class="relative flex flex-col h-full w-full">
        <SheetHeader class="ml-1 px-6 items-baseline gap-1 pb-2">
          <SheetTitle class="text-2xl">Notifications</SheetTitle>
          <a href="/Settings/Notifications">
            <Button variant="link" size="sm" class="p-0 h-auto">Edit Settings</Button>
          </a>
        </SheetHeader>
        <Tabs
          default-value="unread"
          class="flex flex-1 flex-col min-h-0"
          aria-label="Notification filters"
        >
          <div class="flex flex-row justify-between items-center flex-wrap gap-5 px-6">
            <TabsList class="flex" aria-label="Filter notifications by status">
              <TabsTrigger value="unread">
                Unread <span v-if="overview">({{ overview.unread.total }})</span>
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived
                <span v-if="overview">({{ readArchivedCount }})</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="unread" class="flex-col items-end">
              <Button
                :disabled="loadingArchiveAll"
                variant="link"
                size="sm"
                class="text-foreground hover:text-destructive transition-none"
                @click="confirmAndArchiveAll"
              >
                Archive All
              </Button>
            </TabsContent>
            <TabsContent value="archived" class="flex-col items-end">
              <Button
                :disabled="loadingDeleteAll"
                variant="link"
                size="sm"
                class="text-foreground hover:text-destructive transition-none"
                @click="confirmAndDeleteArchives"
              >
                Delete All
              </Button>
            </TabsContent>

            <Select
              :items="filterItems"
              placeholder="Filter By"
              class="h-auto"
              @update:model-value="
                (val: unknown) => {
                  const strVal = String(val);
                  importance = strVal === 'all' || !strVal ? undefined : (strVal as Importance);
                }
              "
            />
          </div>

          <TabsContent value="unread" class="flex-col flex-1 min-h-0">
            <NotificationsList :importance="importance" :type="NotificationType.UNREAD" />
          </TabsContent>

          <TabsContent value="archived" class="flex-col flex-1 min-h-0">
            <NotificationsList :importance="importance" :type="NotificationType.ARCHIVE" />
          </TabsContent>
        </Tabs>
      </div>
    </SheetContent>
  </Sheet>
</template>
