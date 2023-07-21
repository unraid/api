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

  watch(dropdownVisible, (newVal, _oldVal) => {
    console.debug('[dropdownVisible]', newVal, _oldVal);
  });

  onMounted(() => {
    // automatically open the launchpad dropdown on first page load when ENOKEYFILE aka a new server
    const baseStorageName = `unraidConnect_${serverStore.guid}_`;
    if (serverStore.state === 'ENOKEYFILE' && !sessionStorage.getItem(`${baseStorageName}ENOKEYFILE`)) {
      sessionStorage.setItem(`${baseStorageName}ENOKEYFILE`, 'true');
      dropdownShow();
    }
    // automatically open the launchpad dropdown after plugin install on first page load
    if (serverStore.connectPluginInstalled && !serverStore.registered && sessionStorage.getItem(`${baseStorageName}clickedInstallPlugin`)) {
      sessionStorage.removeItem(`${baseStorageName}clickedInstallPlugin`);
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
