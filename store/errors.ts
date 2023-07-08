import { defineStore, createPinia, setActivePinia } from 'pinia';
// import { useAccountStore } from '~/store/account';
// import { useCallbackStore, useCallbackActionsStore } from '~/store/callbackActions';
// import { useInstallKeyStore } from '~/store/installKey';
// import { useServerStore } from '~/store/server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useErrorsStore = defineStore('errors', () => {
  // const accountStore = useAccountStore();
  // const callbackStore = useCallbackStore();
  // const callbackActionsStore = useCallbackActionsStore();
  // const installKeyStore = useInstallKeyStore();
  // const serverStore = useServerStore();

  /** @todo type the errors */
  const errors = ref<any[]>([]);

  const removeError = (index: number) => {
    errors.value = errors.value.filter((_error, i) => i !== index);
  };

  const resetErrors = () => {
    errors.value = [];
  };

  const setError = (error: any) => {
    errors.value.push(error);
  };

  return {
    errors,
    removeError,
    resetErrors,
    setError,
  };
});
