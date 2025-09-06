import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useToggle } from '@vueuse/core';

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
