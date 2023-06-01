import { defineStore, createPinia, setActivePinia } from "pinia";
import { useServerStore } from './server';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useWanIpCheckStore = defineStore('wanIpCheck', () => {
  const serverStore = useServerStore();
  /**
   * State
   */
  const wanIp = ref<string | null>(sessionStorage.getItem('unraidConnect_wanIp'));
  /**
   * Getters
   */
  /**
   * Actions
   */
  return {
    // state
    // getters
    // actions
  };
});
