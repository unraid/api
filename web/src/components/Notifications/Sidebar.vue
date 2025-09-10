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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@unraid/ui';
import { Settings } from 'lucide-vue-next';

import ConfirmDialog from '~/components/ConfirmDialog.vue';
import {
  archiveAllNotifications,
  deleteArchivedNotifications,
  NOTIFICATION_FRAGMENT,
  notificationsOverview,
  resetOverview,
} from '~/components/Notifications/graphql/notification.query';
import {
  notificationAddedSubscription,
  notificationOverviewSubscription,
} from '~/components/Notifications/graphql/notification.subscription';
import NotificationsIndicator from '~/components/Notifications/Indicator.vue';
import NotificationsList from '~/components/Notifications/List.vue';
import { useTrackLatestSeenNotification } from '~/composables/api/use-notifications';
import { useFragment } from '~/composables/gql';
import { NotificationImportance as Importance, NotificationType } from '~/composables/gql/graphql';
import { useConfirm } from '~/composables/useConfirm';

const { mutate: archiveAll, loading: loadingArchiveAll } = useMutation(archiveAllNotifications);
const { mutate: deleteArchives, loading: loadingDeleteAll } = useMutation(deleteArchivedNotifications);
const { mutate: recalculateOverview } = useMutation(resetOverview);
const { confirm } = useConfirm();
const importance = ref<Importance | undefined>(undefined);

const filterItems = [
  { type: 'label' as const, label: 'Notification Types' },
  { label: 'All Types', value: 'all' },
  { label: 'Alert', value: Importance.ALERT },
  { label: 'Info', value: Importance.INFO },
  { label: 'Warning', value: Importance.WARNING },
];

const confirmAndArchiveAll = async () => {
  const confirmed = await confirm({
    title: 'Archive All Notifications',
    description: 'This will archive all notifications on your Unraid server. Continue?',
    confirmText: 'Archive All',
    confirmVariant: 'primary',
  });
  if (confirmed) {
    await archiveAll();
  }
};

const confirmAndDeleteArchives = async () => {
  const confirmed = await confirm({
    title: 'Delete All Archived Notifications',
    description:
      'This will permanently delete all archived notifications currently on your Unraid server. This action cannot be undone.',
    confirmText: 'Delete All',
    confirmVariant: 'destructive',
  });
  if (confirmed) {
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
  const createOpener = () => ({
    label: 'Open',
    onClick: () => window.location.assign(notif.link as string),
  });

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
    <SheetTrigger as-child>
      <Button variant="header" size="header" @click="prepareToViewNotifications">
        <span class="sr-only">Notifications</span>
        <NotificationsIndicator :overview="overview" :seen="haveSeenNotifications" />
      </Button>
    </SheetTrigger>
    <SheetContent
      side="right"
      class="flex h-screen max-h-screen min-h-screen w-full max-w-screen flex-col gap-5 px-0 pb-0 sm:max-w-[540px]"
    >
      <div class="relative flex h-full w-full flex-col">
        <SheetHeader class="ml-1 items-baseline gap-1 px-3 pb-2">
          <SheetTitle class="text-2xl">Notifications</SheetTitle>
        </SheetHeader>
        <Tabs
          default-value="unread"
          class="flex min-h-0 flex-1 flex-col"
          aria-label="Notification filters"
        >
          <div class="flex flex-row flex-wrap items-center justify-between gap-3 px-3">
            <TabsList class="flex" aria-label="Filter notifications by status">
              <TabsTrigger value="unread" as-child>
                <Button variant="ghost" size="sm" class="inline-flex items-center gap-1 px-3 py-1">
                  <span>Unread</span>
                  <span v-if="overview" class="font-normal">({{ overview.unread.total }})</span>
                </Button>
              </TabsTrigger>
              <TabsTrigger value="archived" as-child>
                <Button variant="ghost" size="sm" class="inline-flex items-center gap-1 px-3 py-1">
                  <span>Archived</span>
                  <span v-if="overview" class="font-normal">({{ readArchivedCount }})</span>
                </Button>
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
          </div>

          <div class="mt-2 flex items-center justify-between gap-2 px-3">
            <Select
              :items="filterItems"
              placeholder="Filter By"
              class="h-8 px-3 text-sm"
              @update:model-value="
                (val: unknown) => {
                  const strVal = String(val);
                  importance = strVal === 'all' || !strVal ? undefined : (strVal as Importance);
                }
              "
            />
            <TooltipProvider>
              <Tooltip :delay-duration="0">
                <TooltipTrigger as-child>
                  <a href="/Settings/Notifications">
                    <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                      <Settings class="h-4 w-4" />
                    </Button>
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Notification Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <TabsContent value="unread" class="min-h-0 flex-1 flex-col">
            <NotificationsList :importance="importance" :type="NotificationType.UNREAD" />
          </TabsContent>

          <TabsContent value="archived" class="min-h-0 flex-1 flex-col">
            <NotificationsList :importance="importance" :type="NotificationType.ARCHIVE" />
          </TabsContent>
        </Tabs>
      </div>
    </SheetContent>
  </Sheet>

  <!-- Global Confirm Dialog -->
  <ConfirmDialog />
</template>
