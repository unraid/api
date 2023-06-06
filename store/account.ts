import { useToggle } from '@vueuse/core';
import { defineStore, createPinia, setActivePinia } from "pinia";
import { useCallbackStore } from './callback';
import { useServerStore } from './server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useAccountStore = defineStore('account', () => {
  const callbackStore = useCallbackStore();
  const serverStore = useServerStore();
  // State
  const accountVisible = ref<boolean>(false);
  // Actions
  const recover = () => {
    console.debug('[recover]');
    callbackStore.send('https://account.unraid.net', {
      ...serverStore.serverAccountPayload,
      type: 'recover',
    });
  };
  const replace = () => {
    console.debug('[replace]');
    callbackStore.send('https://account.unraid.net', {
      ...serverStore.serverAccountPayload,
      type: 'replace',
    });
  };
  const signIn = () => {
    console.debug('[signIn]');
    callbackStore.send('https://account.unraid.net', {
      ...serverStore.serverAccountPayload,
      type: 'signIn',
    });
  };
  const signOut = () => {
    console.debug('[signOut]');
    callbackStore.send('https://account.unraid.net', {
      ...serverStore.serverAccountPayload,
      type: 'signOut',
    });
  };
  const accountHide = () => accountVisible.value = false;
  const accountShow = () => accountVisible.value = true;
  const accountToggle = useToggle(accountVisible);

  watch(accountVisible, (newVal, _oldVal) => {
    console.debug('[accountVisible]', newVal, _oldVal);
  });

  return {
    // State
    accountVisible,
    accountHide,
    accountShow,
    // Actions
    recover,
    replace,
    signIn,
    signOut,
    accountToggle,
  };
});
