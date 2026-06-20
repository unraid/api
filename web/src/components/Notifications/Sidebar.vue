<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation, useQuery, useSubscription } from '@vue/apollo-composable';
import { useSessionStorage } from '@vueuse/core';

import {
  Button,
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
import { Archive, Settings, Trash2 } from 'lucide-vue-next';

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
// Filter selections persist for the browser session so navigating between webgui
// pages (each a full reload) keeps the chosen filters in place. '' = All Types.
const importance = useSessionStorage<Importance | ''>('unraid.notifications.importance', '');
// Persistent ("Active") notifications are shown by default; this toggle lets the
// user filter them out of the list when they want to focus on transient items.
const showPersistent = useSessionStorage('unraid.notifications.showPersistent', true);
// The Unread/Archived status tab also sticks for the session.
const activeTab = useSessionStorage('unraid.notifications.tab', 'unread');

const { t } = useI18n();

const filterOptions = computed<Array<{ label: string; value: Importance | '' }>>(() => [
  { label: t('notifications.sidebar.filters.all'), value: '' },
  { label: t('notifications.sidebar.filters.alert'), value: Importance.ALERT },
  { label: t('notifications.sidebar.filters.info'), value: Importance.INFO },
  { label: t('notifications.sidebar.filters.warning'), value: Importance.WARNING },
]);

const confirmAndArchiveAll = async () => {
  const confirmed = await confirm({
    title: t('notifications.sidebar.confirmArchiveAll.title'),
    description: t('notifications.sidebar.confirmArchiveAll.description'),
    confirmText: t('notifications.sidebar.confirmArchiveAll.confirmText'),
    confirmVariant: 'primary',
  });
  if (confirmed) {
    await archiveAll();
  }
};

const confirmAndDeleteArchives = async () => {
  const confirmed = await confirm({
    title: t('notifications.sidebar.confirmDeleteAll.title'),
    description: t('notifications.sidebar.confirmDeleteAll.description'),
    confirmText: t('notifications.sidebar.confirmDeleteAll.confirmText'),
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
    label: t('notifications.sidebar.toastOpen'),
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
        <span class="sr-only">{{ t('notifications.sidebar.openButtonSr') }}</span>
        <NotificationsIndicator :overview="overview" :seen="haveSeenNotifications" />
      </Button>
    </SheetTrigger>
    <SheetContent
      side="right"
      class="flex h-screen max-h-screen min-h-screen w-full max-w-screen flex-col gap-5 px-0 pb-0 sm:max-w-[540px]"
    >
      <div class="relative flex h-full w-full flex-col">
        <SheetHeader class="gap-1 px-4 pt-1 pb-3">
          <div class="flex items-center gap-1.5">
            <SheetTitle class="text-xl font-semibold tracking-tight">{{
              t('notifications.sidebar.title')
            }}</SheetTitle>
            <a href="/Settings/Notifications" :title="t('notifications.sidebar.editSettingsTooltip')">
              <Button
                variant="ghost"
                size="sm"
                class="text-muted-foreground hover:text-foreground size-7 p-0"
              >
                <Settings class="h-4 w-4" />
                <span class="sr-only">{{ t('notifications.sidebar.editSettingsTooltip') }}</span>
              </Button>
            </a>
          </div>
        </SheetHeader>
        <Tabs
          v-model="activeTab"
          class="flex min-h-0 flex-1 flex-col"
          :aria-label="t('notifications.sidebar.statusTabsAria')"
        >
          <div class="flex flex-row flex-wrap items-center justify-between gap-3 px-4">
            <TabsList
              class="bg-muted/50 flex gap-0.5 rounded-lg p-0.5"
              :aria-label="t('notifications.sidebar.statusTabsListAria')"
            >
              <TabsTrigger value="unread" as-child>
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium data-[state=active]:shadow-sm"
                >
                  <span>{{ t('notifications.sidebar.unreadTab') }}</span>
                  <span
                    v-if="overview"
                    class="bg-muted-foreground/15 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums"
                    >{{ overview.unread.total }}</span
                  >
                </Button>
              </TabsTrigger>
              <TabsTrigger value="archived" as-child>
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium data-[state=active]:shadow-sm"
                >
                  <span>{{ t('notifications.sidebar.archivedTab') }}</span>
                  <span
                    v-if="overview"
                    class="bg-muted-foreground/15 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums"
                    >{{ readArchivedCount }}</span
                  >
                </Button>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="unread" class="flex-col items-end">
              <Button
                :disabled="loadingArchiveAll"
                variant="ghost"
                size="sm"
                class="text-muted-foreground hover:text-foreground inline-flex h-8 items-center gap-1.5 px-2 text-xs font-medium"
                @click="confirmAndArchiveAll"
              >
                <Archive class="h-4 w-4" />
                {{ t('notifications.sidebar.archiveAllAction') }}
              </Button>
            </TabsContent>
            <TabsContent value="archived" class="flex-col items-end">
              <Button
                :disabled="loadingDeleteAll"
                variant="ghost"
                size="sm"
                class="text-muted-foreground hover:text-destructive inline-flex h-8 items-center gap-1.5 px-2 text-xs font-medium"
                @click="confirmAndDeleteArchives"
              >
                <Trash2 class="h-4 w-4" />
                {{ t('notifications.sidebar.deleteAllAction') }}
              </Button>
            </TabsContent>
          </div>

          <div class="border-border/60 mt-3 border-b px-4 pb-3">
            <div class="overflow-x-auto">
              <div
                class="border-border/60 bg-muted/60 inline-flex items-center gap-1 rounded-xl border p-1"
                role="group"
              >
                <Button
                  v-for="option in filterOptions"
                  :key="option.value || 'all'"
                  variant="ghost"
                  size="sm"
                  class="h-8 rounded-lg border border-transparent px-3 text-xs font-medium transition-colors"
                  :class="
                    importance === option.value
                      ? 'border-border bg-background text-foreground'
                      : 'text-muted-foreground hover:border-border/60 hover:bg-muted/40 hover:text-foreground'
                  "
                  :aria-pressed="importance === option.value"
                  @click="importance = option.value"
                >
                  {{ option.label }}
                </Button>
                <span class="bg-border/70 mx-0.5 h-5 w-px shrink-0" aria-hidden="true" />
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-8 rounded-lg border border-transparent px-3 text-xs font-medium transition-colors"
                  :class="
                    showPersistent
                      ? 'border-border bg-background text-foreground'
                      : 'text-muted-foreground hover:border-border/60 hover:bg-muted/40 hover:text-foreground'
                  "
                  :aria-pressed="showPersistent"
                  :title="t('notifications.sidebar.filters.activeTooltip')"
                  @click="showPersistent = !showPersistent"
                >
                  {{ t('notifications.sidebar.filters.active') }}
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value="unread" class="min-h-0 flex-1 flex-col">
            <NotificationsList
              :importance="importance || undefined"
              :show-persistent="showPersistent"
              :type="NotificationType.UNREAD"
            />
          </TabsContent>

          <TabsContent value="archived" class="min-h-0 flex-1 flex-col">
            <NotificationsList
              :importance="importance || undefined"
              :show-persistent="showPersistent"
              :type="NotificationType.ARCHIVE"
            />
          </TabsContent>
        </Tabs>
      </div>
    </SheetContent>
  </Sheet>

  <!-- Global Confirm Dialog -->
  <ConfirmDialog />
</template>
