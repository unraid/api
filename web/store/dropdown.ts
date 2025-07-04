import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useToggle } from '@vueuse/core';

/**
 * Uses the shared global Pinia instance from ~/store/globalPinia.ts
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
import '~/store/globalPinia';

export const useDropdownStore = defineStore('dropdown', () => {
  const dropdownVisible = ref<boolean>(false);

  const dropdownHide = () => {
    dropdownVisible.value = false;
  };
  const dropdownShow = () => {
    dropdownVisible.value = true;
  };
  const dropdownToggle = useToggle(dropdownVisible);

  return {
    dropdownVisible,
    dropdownHide,
    dropdownShow,
    dropdownToggle,
  };
});
