import { NotificationImportance } from '~/composables/gql/graphql';

export const NOTIFICATION_ICONS: Record<NotificationImportance, string> = {
  [NotificationImportance.INFO]: 'i-heroicons-check-badge-20-solid',
  [NotificationImportance.WARNING]: 'i-heroicons-exclamation-triangle-20-solid',
  [NotificationImportance.ALERT]: 'i-heroicons-shield-exclamation-20-solid',
};

export const NOTIFICATION_COLORS: Record<NotificationImportance, string> = {
  [NotificationImportance.INFO]: 'text-unraid-green',
  [NotificationImportance.WARNING]: 'text-yellow-accent',
  [NotificationImportance.ALERT]: 'text-unraid-red',
};

// Toast color mapping (used in Sidebar and CriticalNotifications)
export const NOTIFICATION_TOAST_COLORS: Record<
  NotificationImportance,
  'error' | 'warning' | 'info' | 'success'
> = {
  [NotificationImportance.ALERT]: 'error',
  [NotificationImportance.WARNING]: 'warning',
  [NotificationImportance.INFO]: 'success',
};
