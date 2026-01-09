<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation, useQuery, useSubscription } from '@vue/apollo-composable';

import { navigate } from '~/helpers/external-navigation';

import ConfirmDialog from '~/components/ConfirmDialog.vue';
import { NOTIFICATION_TOAST_COLORS } from '~/components/Notifications/constants';
import {
  archiveAllNotifications,
  deleteArchivedNotifications,
  NOTIFICATION_FRAGMENT,
  notificationsOverview,
  resetOverview,
} from '~/components/Notifications/graphql/notification.query';
import {
  notificationEventSubscription,
  notificationOverviewSubscription,
} from '~/components/Notifications/graphql/notification.subscription';
import NotificationsIndicator from '~/components/Notifications/Indicator.vue';
import NotificationsList from '~/components/Notifications/List.vue';
import { useTrackLatestSeenNotification } from '~/composables/api/use-notifications';
import { useFragment } from '~/composables/gql';
import { NotificationImportance as Importance, NotificationType } from '~/composables/gql/graphql';
import { useConfirm } from '~/composables/useConfirm';
import { useThemeStore } from '~/store/theme';
import { useUnraidApiStore } from '~/store/unraidApi';

const toast = useToast();
const themeStore = useThemeStore();
const unraidApiStore = useUnraidApiStore();

const { mutate: archiveAll, loading: loadingArchiveAll } = useMutation(archiveAllNotifications);
const { mutate: deleteArchives, loading: loadingDeleteAll } = useMutation(deleteArchivedNotifications);
const { mutate: recalculateOverview } = useMutation(resetOverview);
const { confirm } = useConfirm();
const importance = ref<Importance | undefined>(undefined);

const { t } = useI18n();

const activeFilter = computed({
  get: () => importance.value ?? 'all',
  set: (val) => {
    importance.value = val === 'all' ? undefined : (val as Importance);
  },
});

const filterTabs = computed(() => [
  { label: t('notifications.sidebar.filters.all'), value: 'all' as const },
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
    try {
      await archiveAll();
    } catch (e) {
      console.error('[Notifications] Archive all failed:', e);
      toast.add({
        title: t('notifications.sidebar.archiveAllError'),
        color: 'error',
      });
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
    try {
      await deleteArchives();
    } catch (e) {
      console.error('[Notifications] Delete all failed:', e);
      toast.add({
        title: t('notifications.sidebar.deleteAllError'),
        color: 'error',
      });
    }
  }
};

const { result, refetch } = useQuery(notificationsOverview);

const handleRefetch = () => {
  recalculateOverview()
    .catch((e) => {
      console.error('[Notifications] Recalculate overview failed:', e);
    })
    .finally(() => {
      void refetch();
    });
};

watch(
  () => unraidApiStore.unraidApiStatus,
  (status) => {
    if (status === 'online') {
      handleRefetch();
    }
  }
);

const { latestNotificationTimestamp, haveSeenNotifications } = useTrackLatestSeenNotification();
// Subscribe to general events
const { onResult: onNotificationEvent } = useSubscription(notificationEventSubscription);

onNotificationEvent(({ data }) => {
  if (!data?.notificationEvent) return;
  const { type, notification: notifData } = data.notificationEvent;

  // We primarily care about NEW items for toasts + timestamp tracking
  // But strictly speaking, the old code only cared about ADDED to UNREAD.
  if (type !== 'ADDED' || !notifData) return;

  const notif = useFragment(NOTIFICATION_FRAGMENT, notifData);
  if (notif.type !== NotificationType.UNREAD) return;

  if (notif.timestamp) {
    latestNotificationTimestamp.value = notif.timestamp;
  }

  const color = NOTIFICATION_TOAST_COLORS[notif.importance];
  const createOpener = () => ({
    label: t('notifications.sidebar.toastOpen'),
    onClick: () => {
      if (notif.link) {
        navigate(notif.link);
      }
    },
  });

  requestAnimationFrame(() =>
    toast.add({
      title: notif.title,
      description: notif.subject,
      color,
      actions: notif.link ? [createOpener()] : undefined,
    })
  );
});

const overview = computed(() => {
  if (!result.value) {
    return;
  }
  return result.value.notifications.overview;
});

/** The archived count is now correctly reported by the API. */
const readArchivedCount = computed(() => {
  if (!overview.value) return 0;
  return overview.value.archive.total;
});

const prepareToViewNotifications = () => {
  void recalculateOverview();
};

const isOpen = ref(false);
const activeTab = ref<'unread' | 'archived'>('unread');

const tabs = computed(() => [
  {
    label: t('notifications.sidebar.unreadTab'),
    value: 'unread' as const,
    badge: overview.value?.unread.total ?? 0,
  },
  {
    label: t('notifications.sidebar.archivedTab'),
    value: 'archived' as const,
    badge: readArchivedCount.value ?? 0,
  },
]);
</script>

<template>
  <div>
    <UButton
      variant="ghost"
      color="neutral"
      class="text-header-text-primary hover:bg-[color-mix(in_oklab,hsl(var(--accent))_20%,transparent)] active:bg-transparent"
      :style="{ color: themeStore.theme.textColor || undefined }"
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

    <USlideover v-model:open="isOpen" side="right" :title="t('notifications.sidebar.title')">
      <template #body>
        <div class="flex h-full flex-col">
          <div class="flex flex-1 flex-col overflow-hidden">
            <!-- Controls Area -->
            <div class="flex flex-col gap-3 px-0 py-3">
              <!-- Tabs & Action Button Row -->
              <div class="flex items-center justify-between gap-3">
                <UTabs
                  v-model="activeTab"
                  :items="tabs"
                  :content="false"
                  variant="pill"
                  color="primary"
                />
                <!-- Action Button -->
                <UButton
                  v-if="activeTab === 'unread'"
                  :disabled="loadingArchiveAll"
                  variant="link"
                  color="neutral"
                  @click="confirmAndArchiveAll"
                >
                  {{ t('notifications.sidebar.archiveAllAction') }}
                </UButton>
                <UButton
                  v-else
                  :disabled="loadingDeleteAll"
                  variant="link"
                  color="neutral"
                  @click="confirmAndDeleteArchives"
                >
                  {{ t('notifications.sidebar.deleteAllAction') }}
                </UButton>
              </div>

              <!-- Filters & Settings Row -->
              <div class="flex items-center justify-between gap-3">
                <!-- Filter Button Group -->
                <UTabs
                  v-model="activeFilter"
                  :items="filterTabs"
                  :content="false"
                  variant="pill"
                  color="neutral"
                />
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
                    @click="navigate('/Settings/Notifications')"
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
                @refetched="handleRefetch"
              />
              <NotificationsList
                v-else
                :importance="importance"
                :type="NotificationType.ARCHIVE"
                class="flex-1"
                @refetched="handleRefetch"
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
