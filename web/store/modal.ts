import { defineStore } from 'pinia';
import { useToggle } from '@vueuse/core';

/**
 * Uses the shared global Pinia instance from ~/store/globalPinia.ts
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
import '~/store/globalPinia';

export const useModalStore = defineStore('modal', () => {
  const [modalVisible, modalToggle] = useToggle(true);

  const modalHide = () => {
    modalVisible.value = false;
  };
  const modalShow = () => {
    modalVisible.value = true;
  };

  return {
    modalVisible,
    modalHide,
    modalShow,
    modalToggle,
  };
});
