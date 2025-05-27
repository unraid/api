import { createPinia, defineStore, setActivePinia } from 'pinia';
import { useToggle } from '@vueuse/core';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

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
