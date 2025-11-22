<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation, useQuery, useSubscription } from '@vue/apollo-composable';

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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@unraid/ui';
import { Settings } from 'lucide-vue-next';

import ConfirmDialog from '~/components/ConfirmDialog.vue';
import {
  archiveAllNotifications,
  startDeleteNotifications,
  NOTIFICATION_FRAGMENT,
  NOTIFICATION_JOB_FRAGMENT,
  notificationsOverview,
  notificationJobStatus,
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
import {
  NotificationImportance as Importance,
  NotificationJobState,
  NotificationType,
} from '~/composables/gql/graphql';
import { useApolloClient } from '@vue/apollo-composable';
import { useConfirm } from '~/composables/useConfirm';

const { mutate: startArchiveAllJob, loading: loadingArchiveAll } = useMutation(archiveAllNotifications);
const { mutate: startDeleteAll, loading: loadingDeleteAll } = useMutation(startDeleteNotifications);
const { client } = useApolloClient();
const { mutate: recalculateOverview } = useMutation(resetOverview);
const { confirm } = useConfirm();
const importance = ref<Importance | undefined>(undefined);

const jobPollers: Record<'archiveAll' | 'deleteArchived' | 'deleteUnread', ReturnType<typeof setInterval> | null> = {
  archiveAll: null,
  deleteArchived: null,
  deleteUnread: null,
};

const activeJobs = reactive<
  Record<'archiveAll' | 'deleteArchived' | 'deleteUnread', { id: string; state: NotificationJobState; processed: number; total: number; error?: string | null } | null>
>({
  archiveAll: null,
  deleteArchived: null,
  deleteUnread: null,
});

const activeStates = [NotificationJobState.QUEUED, NotificationJobState.RUNNING];

const stopPolling = (key: keyof typeof jobPollers) => {
  const interval = jobPollers[key];
  if (interval) {
    clearInterval(interval);
    jobPollers[key] = null;
  }
};

const setJob = (key: keyof typeof jobPollers, job?: unknown) => {
  const parsed = job ? useFragment(NOTIFICATION_JOB_FRAGMENT, job) : null;
  activeJobs[key] = parsed;
  if (!parsed || !activeStates.includes(parsed.state)) {
    stopPolling(key);
  }
};

const pollJob = (key: keyof typeof jobPollers) => {
  const job = activeJobs[key];
  if (!job) return;

  stopPolling(key);
  if (!activeStates.includes(job.state)) return;

  jobPollers[key] = setInterval(async () => {
    const { data } = await client.query({
      query: notificationJobStatus,
      variables: { id: job.id },
      fetchPolicy: 'network-only',
    });
    const updated = data?.notifications.job;
    if (updated) {
      setJob(key, updated);
    }
  }, 750);
};

const isJobActive = (key: keyof typeof jobPollers) => {
  const job = activeJobs[key];
  return Boolean(job && activeStates.includes(job.state));
};

const jobLabel = (key: keyof typeof jobPollers, fallback: string) => {
  const job = activeJobs[key];
  if (job && activeStates.includes(job.state)) {
    return t('notifications.sidebar.processingStatus', {
      processed: job.processed,
      total: job.total,
    });
  }
  return fallback;
};

const { t } = useI18n();

const filterOptions = computed<Array<{ label: string; value?: Importance }>>(() => [
  { label: t('notifications.sidebar.filters.all') },
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
    const { data } = await startArchiveAllJob({ importance: importance.value });
    const job = data?.notifications.startArchiveAll;
    if (job) {
      setJob('archiveAll', job);
      pollJob('archiveAll');
    }
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
    const { data } = await startDeleteAll({ type: NotificationType.ARCHIVE });
    const job = data?.notifications.startDeleteAll;
    if (job) {
      setJob('deleteArchived', job);
      pollJob('deleteArchived');
    }
  }
};

const confirmAndDeleteUnread = async () => {
  const confirmed = await confirm({
    title: t('notifications.sidebar.confirmDeleteUnread.title'),
    description: t('notifications.sidebar.confirmDeleteUnread.description'),
    confirmText: t('notifications.sidebar.confirmDeleteUnread.confirmText'),
    confirmVariant: 'destructive',
  });
  if (confirmed) {
    const { data } = await startDeleteAll({ type: NotificationType.UNREAD });
    const job = data?.notifications.startDeleteAll;
    if (job) {
      setJob('deleteUnread', job);
      pollJob('deleteUnread');
    }
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

onBeforeUnmount(() => {
  Object.values(jobPollers).forEach((interval) => interval && clearInterval(interval));
});
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
        <SheetHeader class="ml-1 items-baseline gap-1 px-3 pb-2">
          <SheetTitle class="text-2xl">{{ t('notifications.sidebar.title') }}</SheetTitle>
        </SheetHeader>
        <Tabs
          default-value="unread"
          class="flex min-h-0 flex-1 flex-col"
          :aria-label="t('notifications.sidebar.statusTabsAria')"
        >
          <div class="flex flex-row flex-wrap items-center justify-between gap-3 px-3">
            <TabsList class="flex" :aria-label="t('notifications.sidebar.statusTabsListAria')">
              <TabsTrigger value="unread" as-child>
                <Button variant="ghost" size="sm" class="inline-flex items-center gap-1 px-3 py-1">
                  <span>{{ t('notifications.sidebar.unreadTab') }}</span>
                  <span v-if="overview" class="font-normal">({{ overview.unread.total }})</span>
                </Button>
              </TabsTrigger>
              <TabsTrigger value="archived" as-child>
                <Button variant="ghost" size="sm" class="inline-flex items-center gap-1 px-3 py-1">
                  <span>{{ t('notifications.sidebar.archivedTab') }}</span>
                  <span v-if="overview" class="font-normal">({{ readArchivedCount }})</span>
                </Button>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="unread" class="flex-col items-end">
              <Button
                :disabled="loadingArchiveAll || isJobActive('archiveAll')"
                variant="link"
                size="sm"
                class="text-foreground hover:text-destructive transition-none"
                @click="confirmAndArchiveAll"
              >
                {{ jobLabel('archiveAll', t('notifications.sidebar.archiveAllAction')) }}
              </Button>
              <Button
                :disabled="loadingDeleteAll || isJobActive('deleteUnread')"
                variant="link"
                size="sm"
                class="text-foreground hover:text-destructive transition-none"
                @click="confirmAndDeleteUnread"
              >
                {{ jobLabel('deleteUnread', t('notifications.sidebar.deleteAllAction')) }}
              </Button>
            </TabsContent>
            <TabsContent value="archived" class="flex-col items-end">
              <Button
                :disabled="loadingDeleteAll || isJobActive('deleteArchived')"
                variant="link"
                size="sm"
                class="text-foreground hover:text-destructive transition-none"
                @click="confirmAndDeleteArchives"
              >
                {{ jobLabel('deleteArchived', t('notifications.sidebar.deleteAllAction')) }}
              </Button>
            </TabsContent>
          </div>

          <div class="mt-3 flex items-start justify-between gap-3 px-3">
            <div class="flex min-w-0 flex-1 flex-col gap-2">
              <div
                class="border-border/60 bg-muted/60 flex flex-wrap items-center gap-1 rounded-xl border p-1"
                role="group"
              >
                <Button
                  v-for="option in filterOptions"
                  :key="option.value ?? 'all'"
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
              </div>
            </div>
            <div class="shrink-0">
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
                    <p>{{ t('notifications.sidebar.editSettingsTooltip') }}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
