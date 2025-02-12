<script setup lang="ts">
import { useMutation, useQuery, useSubscription } from '@vue/apollo-composable';

import {
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
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
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- false positive :(
import { Importance, NotificationType } from '~/composables/gql/graphql';
import {
  archiveAllNotifications,
  deleteArchivedNotifications,
  NOTIFICATION_FRAGMENT,
  notificationsOverview,
} from './graphql/notification.query';
import { notificationAddedSubscription } from './graphql/notification.subscription';

const { mutate: archiveAll, loading: loadingArchiveAll } = useMutation(archiveAllNotifications);
const { mutate: deleteArchives, loading: loadingDeleteAll } = useMutation(deleteArchivedNotifications);
const { teleportTarget, determineTeleportTarget } = useTeleport();
const importance = ref<Importance | undefined>(undefined);

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

const { result } = useQuery(notificationsOverview, null, {
  pollInterval: 2_000, // 2 seconds
});
const { latestNotificationTimestamp, haveSeenNotifications } = useTrackLatestSeenNotification();
const { onResult: onNotificationAdded } = useSubscription(notificationAddedSubscription);

onNotificationAdded(({ data }) => {
  if (!data) return;
  const notif = useFragment(NOTIFICATION_FRAGMENT, data.notificationAdded);
  if (notif.type !== NotificationType.Unread) return;

  if (notif.timestamp) {
    latestNotificationTimestamp.value = notif.timestamp;
  }
  // probably smart to leave this log outside the if-block for the initial release
  console.log('incoming notification', notif);
  if (!globalThis.toast) {
    return;
  }

  const funcMapping: Record<Importance, (typeof globalThis)['toast']['info' | 'error' | 'warning']> = {
    [Importance.Alert]: globalThis.toast.error,
    [Importance.Warning]: globalThis.toast.warning,
    [Importance.Info]: globalThis.toast.info,
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
</script>

<template>
  <Sheet>
    <SheetTrigger @click="determineTeleportTarget">
      <span class="sr-only">Notifications</span>
      <NotificationsIndicator :overview="overview" :seen="haveSeenNotifications" />
    </SheetTrigger>
    <SheetContent
      :to="teleportTarget as HTMLElement"
      class="w-full max-w-[100vw] sm:max-w-[540px] max-h-screen h-screen min-h-screen px-0 flex flex-col gap-5 pb-0"
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
              @update:model-value="
                (val: string) => {
                  importance = val === 'all' ? undefined : (val as Importance);
                }
              "
            >
              <SelectTrigger class="h-auto">
                <SelectValue class="text-gray-400 leading-6" placeholder="Filter By" />
              </SelectTrigger>
              <SelectContent :to="teleportTarget">
                <SelectGroup>
                  <SelectLabel>Notification Types</SelectLabel>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem :value="Importance.Alert"> Alert </SelectItem>
                  <SelectItem :value="Importance.Info">Info</SelectItem>
                  <SelectItem :value="Importance.Warning">Warning</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="unread" class="flex-col flex-1 min-h-0">
            <NotificationsList :importance="importance" :type="NotificationType.Unread" />
          </TabsContent>

          <TabsContent value="archived" class="flex-col flex-1 min-h-0">
            <NotificationsList :importance="importance" :type="NotificationType.Archive" />
          </TabsContent>
        </Tabs>
      </div>
    </SheetContent>
  </Sheet>
</template>
