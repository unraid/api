import { defineStore, createPinia, setActivePinia } from 'pinia';
import type { NotificationItemProps } from "~/types/ui/notification";

setActivePinia(createPinia());

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<NotificationItemProps[]>([]);
  const isOpen = ref<boolean>(false);

  const title = computed<string>(() => isOpen.value ? 'Notifications Are Open' : 'Notifications Are Closed');

  const toggle = () => isOpen.value = !isOpen.value;

  const setNotifications = (newNotifications: NotificationItemProps[]) => {
    notifications.value = newNotifications;
  };

  return {
    // state
    isOpen,
    // getters
    title,
    notifications,
    // actions
    setNotifications,
    toggle,
  };
});
