import { useToggle } from '@vueuse/core';
import { defineStore, createPinia, setActivePinia } from "pinia";
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const usePromoStore = defineStore('promo', () => {
  const visible = ref<boolean>(false);

  const hide = () => visible.value = false;
  const show = () => visible.value = true;
  const toggle = useToggle(visible);

  watch(visible, () => {
    console.debug('[visible]', visible.value);
  });

  return {
    visible,
    hide,
    show,
    toggle,
  };
});
