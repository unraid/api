import { defineStore, createPinia, setActivePinia } from 'pinia';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useNotificationsStore = defineStore('notifications', () => {

  const isOpen = ref<boolean>(false);

  const title = computed<string>(() => isOpen.value ? 'Notifications Are Open' : 'Notifications Are Closed');

  const toggle = () => isOpen.value = !isOpen.value;

  return {
    // state
    isOpen,
    // getters
    title,
    // actions
    toggle,
  };
});
