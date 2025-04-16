import { computed, ref } from 'vue';
import { createPinia, defineStore, setActivePinia } from 'pinia';

import type { NotificationFragmentFragment } from '~/composables/gql/graphql';

setActivePinia(createPinia());

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<NotificationFragmentFragment[]>([]);
  const isOpen = ref<boolean>(false);

  const title = computed<string>(() =>
    isOpen.value ? 'Notifications Are Open' : 'Notifications Are Closed'
  );

  const toggle = () => (isOpen.value = !isOpen.value);

  const setNotifications = (newNotifications: NotificationFragmentFragment[]) => {
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
