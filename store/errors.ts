import { XCircleIcon } from '@heroicons/vue/24/solid';
import { defineStore, createPinia, setActivePinia } from 'pinia';

// import { useAccountStore } from '~/store/account';
// import { useCallbackStore, useCallbackActionsStore } from '~/store/callbackActions';
// import { useInstallKeyStore } from '~/store/installKey';
// import { useServerStore } from '~/store/server';
import type { ButtonProps } from '~/components/Brand/Button.vue';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export type ErrorType = 'account' | 'callback' | 'installKey' | 'server' | 'serverState';
export interface Error {
  actions?: ButtonProps[];
  heading: string;
  level: 'error' | 'info' | 'warning';
  message: string;
  ref?: string;
  supportLink?: boolean;
  type: ErrorType;
}

export const useErrorsStore = defineStore('errors', () => {
  // const accountStore = useAccountStore();
  // const callbackStore = useCallbackStore();
  // const callbackActionsStore = useCallbackActionsStore();
  // const installKeyStore = useInstallKeyStore();
  // const serverStore = useServerStore();

  const errors = ref<Error[]>([]);

  const removeErrorByIndex = (index: number) => {
    errors.value = errors.value.filter((_error, i) => i !== index);
  };

  const removeErrorByRef = (ref: ErrorType) => {
    errors.value = errors.value.filter(error => error?.ref !== ref);
  };

  const resetErrors = () => {
    errors.value = [];
  };

  const setError = (error: any) => {
    errors.value.push(error);
  };

  return {
    errors,
    removeErrorByIndex,
    removeErrorByRef,
    resetErrors,
    setError,
  };
});
