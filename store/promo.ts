import { useToggle } from '@vueuse/core';
import { defineStore, createPinia, setActivePinia } from 'pinia';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const usePromoStore = defineStore('promo', () => {
  const promoVisible = ref<boolean>(false);

  const promoHide = () => promoVisible.value = false;
  const promoShow = () => promoVisible.value = true;
  const promoToggle = useToggle(promoVisible);
  watch(promoVisible, (newVal, _oldVal) => {
    console.debug('[promoVisible]', newVal, _oldVal);
  });

  return {
    promoVisible,
    promoHide,
    promoShow,
    promoToggle,
  };
});
