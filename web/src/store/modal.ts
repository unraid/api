import { defineStore } from 'pinia';
import { useToggle } from '@vueuse/core';

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
