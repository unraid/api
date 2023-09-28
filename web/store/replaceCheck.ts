import {
  CheckCircleIcon,
  XCircleIcon,
  ShieldExclamationIcon,
} from '@heroicons/vue/24/solid';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import type { WretchError } from 'wretch';

import { validateGuid, type ValidateGuidPayload } from '~/composables/services/keyServer';
import { useServerStore } from '~/store/server';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useReplaceCheckStore = defineStore('replaceCheck', () => {
  const serverStore = useServerStore();

  const guid = computed(() => serverStore.guid);
  const keyfile = computed(() => serverStore.keyfile);

  const error = ref<{
    name: string;
    message: string;
    stack?: string | undefined;
    cause?: unknown;
  } | null>(null);
  const status = ref<'checking' | 'eligible' | 'error' | 'ineligible' | 'ready'>(guid.value ? 'ready' : 'error');
  const statusOutput = computed(() => {
    // text values are translated in the component
    switch (status.value) {
      case 'eligible':
        return {
          color: 'green',
          icon: CheckCircleIcon,
          text: 'Eligible',
        };
      case 'ineligible':
        return {
          color: 'red',
          icon: XCircleIcon,
          text: 'Ineligible',
        };
      case 'error':
        return {
          color: 'red',
          icon: ShieldExclamationIcon,
          text: error.value?.message || 'Unknown error',
        };
      default: return null;
    }
  });
  const validationResponse = ref<ValidateGuidPayload | undefined>(
    sessionStorage.getItem('replaceCheck')
      ? JSON.parse(sessionStorage.getItem('replaceCheck') as string)
      : undefined
  );

  const check = async () => {
    if (!guid.value) {
      status.value = 'error';
      error.value = { name: 'Error', message: 'Flash GUID required to check replacement status' };
    }
    if (!keyfile.value) {
      status.value = 'error';
      error.value = { name: 'Error', message: 'Keyfile required to check replacement status' };
    }

    try {
      status.value = 'checking';
      error.value = null;
      /**
       * @todo will eventually take a keyfile and provide renewal details. If this says there's a reneal key available then we'll make a separate request to replace / swap the new key. We'll also use this to update the keyfile to the new key type for legacy users.
       * endpoint will be through key server
       * this should happen automatically when the web components are mounted…
       * account.unraid.net will do a similar thing`
       */
      const response: ValidateGuidPayload = await validateGuid({
        guid: guid.value,
        keyfile: keyfile.value,
      }).json();
      sessionStorage.setItem('replaceCheck', JSON.stringify(response));
      status.value = response?.replaceable ? 'eligible' : 'ineligible';
    } catch (err) {
      const catchError = err as WretchError;
      status.value = 'error';
      error.value = catchError?.message ? catchError : { name: 'Error', message: 'Unknown error' };
      console.error('[ReplaceCheck.check]', catchError);
    }
  };

  /**
   * If we already have a validation response, set the status to eligible or ineligible
   */
  onBeforeMount(() => {
    if (validationResponse.value) {
      status.value = validationResponse.value?.replaceable ? 'eligible' : 'ineligible';
    }
  });

  return {
    status,
    statusOutput,
    check,
  };
});
