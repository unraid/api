<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation, useQuery, useSubscription } from '@vue/apollo-composable';

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

const openSettings = () => {
  window.location.assign('/Settings/Notifications');
};

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

const isOpen = ref(false);
const activeTab = ref<'unread' | 'archived'>('unread');

const tabs = computed(() => [
  {
    id: 'unread',
    label: t('notifications.sidebar.unreadTab'),
    count: overview.value?.unread.total,
  },
  {
    id: 'archived',
    label: t('notifications.sidebar.archivedTab'),
    count: readArchivedCount.value,
  },
]);
</script>

<!-- totally scuffed but we use: !bg-transparent, !bg-none, hover:text-current to override conflicting webgui/api styles -->
<template>
  <div>
    <UButton
      variant="ghost"
      color="neutral"
      class="!bg-transparent"
      @click="
        () => {
          isOpen = true;
          prepareToViewNotifications();
        }
      "
    >
      <span class="sr-only">{{ t('notifications.sidebar.openButtonSr') }}</span>
      <NotificationsIndicator :overview="overview" :seen="haveSeenNotifications" />
    </UButton>

    <USlideover
      v-model:open="isOpen"
      side="right"
      :title="t('notifications.sidebar.title')"
      :close="{
        color: 'neutral',
        variant: 'ghost',
        class: 'rounded-md !bg-none hover:text-current',
      }"
      :ui="{
        content: 'w-screen max-w-screen sm:max-w-[540px]',
        title: 'text-3xl font-normal',
      }"
    >
      <template #body>
        <div class="flex h-full flex-col">
          <div class="flex flex-1 flex-col overflow-hidden">
            <!-- Controls Area -->
            <div class="flex flex-col gap-3 px-0 py-3">
              <!-- Tabs & Action Button Row -->
              <div class="flex items-center justify-between gap-3">
                <!-- Custom Pill Tabs -->
                <div class="dark:bg-muted flex shrink-0 gap-1 rounded-lg bg-gray-100 p-2">
                  <UButton
                    v-for="tab in tabs"
                    :key="tab.id"
                    @click="activeTab = tab.id as 'unread' | 'archived'"
                    :color="activeTab === tab.id ? 'primary' : 'neutral'"
                    :variant="activeTab === tab.id ? 'solid' : 'ghost'"
                    size="sm"
                    class="!bg-none transition-colors"
                    :class="[
                      activeTab === tab.id
                        ? 'text-white'
                        : 'text-gray-500 hover:bg-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:bg-transparent dark:hover:text-gray-200',
                    ]"
                  >
                    <span>{{ tab.label }}</span>
                    <span v-if="tab.count !== undefined" class="opacity-90">({{ tab.count }})</span>
                  </UButton>
                </div>

                <!-- Action Button -->
                <UButton
                  v-if="activeTab === 'unread'"
                  :disabled="loadingArchiveAll"
                  variant="link"
                  color="neutral"
                  class="hover:text-primary h-auto !bg-none p-0 font-normal hover:underline"
                  @click="confirmAndArchiveAll"
                >
                  {{ t('notifications.sidebar.archiveAllAction') }}
                </UButton>
                <UButton
                  v-else
                  :disabled="loadingDeleteAll"
                  variant="link"
                  color="neutral"
                  class="text-foreground hover:text-destructive h-auto !bg-none p-0 font-normal transition-colors hover:underline"
                  @click="confirmAndDeleteArchives"
                >
                  {{ t('notifications.sidebar.deleteAllAction') }}
                </UButton>
              </div>

              <!-- Filters & Settings Row -->
              <div class="flex items-center justify-between gap-3">
                <!-- Filter Button Group -->
                <div
                  class="dark:bg-muted flex items-center gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1"
                >
                  <UButton
                    v-for="option in filterOptions"
                    :key="option.value ?? 'all'"
                    @click="importance = option.value"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    class="!bg-none whitespace-nowrap transition-colors"
                    :class="[
                      importance === option.value
                        ? 'dark:bg-accented bg-white text-gray-900 shadow-sm ring-1 ring-gray-200 hover:bg-white hover:text-gray-900 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700 dark:hover:text-white'
                        : 'text-muted-foreground hover:text-foreground hover:bg-transparent hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600',
                    ]"
                  >
                    {{ option.label }}
                  </UButton>
                </div>
                <!-- Settings Icon -->
                <UTooltip
                  :delay-duration="0"
                  :content="{
                    align: 'center',
                    side: 'top',
                    sideOffset: 8,
                  }"
                  :text="t('notifications.sidebar.editSettingsTooltip')"
                >
                  <UButton
                    variant="ghost"
                    color="neutral"
                    icon="i-heroicons-cog-6-tooth-20-solid"
                    class="h-8 w-8 !bg-none hover:text-current"
                    @click="openSettings"
                  />
                </UTooltip>
              </div>
            </div>

            <!-- Notifications List Content -->
            <div class="flex flex-1 flex-col overflow-hidden">
              <NotificationsList
                v-if="activeTab === 'unread'"
                :importance="importance"
                :type="NotificationType.UNREAD"
                class="flex-1"
              />
              <NotificationsList
                v-else
                :importance="importance"
                :type="NotificationType.ARCHIVE"
                class="flex-1"
              />
            </div>
          </div>
        </div>
      </template>
    </USlideover>
    <!-- Global Confirm Dialog -->
    <ConfirmDialog />
  </div>
</template>
