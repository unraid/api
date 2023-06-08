import { defineStore, createPinia, setActivePinia } from 'pinia';
// import { useAccountStore } from './account';
// import { useCallbackStore } from './callback';
// import { useInstallKeyStore } from './installKey';
// import { useServerStore } from './server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useErrorsStore = defineStore('errors', () => {
  // const accountStore = useAccountStore();
  // const callbackStore = useCallbackStore();
  // const installKeyStore = useInstallKeyStore();
  // const serverStore = useServerStore();

  /** @todo type the errors */
  const errors = ref<any[]>([]);

  const setError = (error: any) => {
    errors.value.push(error);
  };

  return {
    errors,
    setError,
  };
});
