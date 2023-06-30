import { useToggle } from '@vueuse/core';
import { defineStore, createPinia, setActivePinia } from 'pinia';

import { useDropdownStore } from '~/store/dropdown';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const usePromoStore = defineStore('promo', () => {
  const dropdownStore = useDropdownStore();

  const promoVisible = ref<boolean>(false);
  
  const openOnNextLoad = () => sessionStorage.setItem('unraidConnectPromo', 'show');
  const promoHide = () => promoVisible.value = false;
  const promoShow = () => promoVisible.value = true;
  const promoToggle = useToggle(promoVisible);

  watch(promoVisible, (newVal, _oldVal) => {
    console.debug('[promoVisible]', newVal, _oldVal);
    if (newVal) { // close the dropdown when the promo is opened
      dropdownStore.dropdownHide();
    }
  });

  onBeforeMount(() => {
    if (sessionStorage.getItem('unraidConnectPromo') === 'show') {
      sessionStorage.removeItem('unraidConnectPromo');
      promoShow();
    }
  });

  return {
    promoVisible,

    openOnNextLoad,
    promoHide,
    promoShow,
    promoToggle,
  };
});
