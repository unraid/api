import { useToggle } from '@vueuse/core';
import { defineStore, createPinia, setActivePinia } from "pinia";
import { usePromoStore } from './promo';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useDropdownStore = defineStore('dropdown', () => {
  const promoStore = usePromoStore();

  const dropdownVisible = ref<boolean>(false);

  const dropdownHide = () => dropdownVisible.value = false;
  const dropdownShow = () => dropdownVisible.value = true;
  const dropdownToggle = useToggle(dropdownVisible);

  watch(dropdownVisible, (newVal, _oldVal) => {
    console.debug('[dropdownVisible]', newVal, _oldVal);
    if (!newVal) promoStore.promoHide();
  });

  return {
    dropdownVisible,
    dropdownHide,
    dropdownShow,
    dropdownToggle,
  };
});
