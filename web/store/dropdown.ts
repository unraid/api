import { useToggle } from '@vueuse/core';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import { useServerStore } from './server';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useDropdownStore = defineStore('dropdown', () => {
  const serverStore = useServerStore();

  const dropdownVisible = ref<boolean>(false);

  const dropdownHide = () => { dropdownVisible.value = false; };
  const dropdownShow = () => { dropdownVisible.value = true; };
  const dropdownToggle = useToggle(dropdownVisible);

  /**
   * Automatically open the user dropdown on first page load when ENOKEYFILE aka a new server
   */
  const serverStateEnokeyfile = computed(() => serverStore.state === 'ENOKEYFILE');
  watch(serverStateEnokeyfile, (newVal, oldVal) => {
    console.debug('[watch.serverStateEnokeyfile]', newVal, oldVal);
    const autoOpenSessionStorage = `unraid_${serverStore.guid.slice(-12) ?? 'NO_GUID'}_ENOKEYFILE`;
    if (newVal && !sessionStorage.getItem(autoOpenSessionStorage)) {
      sessionStorage.setItem(autoOpenSessionStorage, 'true');
      dropdownShow();
    }
  });

  return {
    dropdownVisible,
    dropdownHide,
    dropdownShow,
    dropdownToggle,
  };
});
