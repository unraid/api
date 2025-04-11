import { computed, ref } from 'vue';
import { createPinia, defineStore, setActivePinia } from 'pinia';

import type { ExternalKeyActions } from '@unraid/shared-callbacks';

import { WebguiInstallKey } from '~/composables/services/webgui';
import { useErrorsStore } from '~/store/errors';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useInstallKeyStore = defineStore('installKey', () => {
  const errorsStore = useErrorsStore();

  const keyInstallStatus = ref<'failed' | 'installing' | 'ready' | 'success'>('ready');

  const keyAction = ref<ExternalKeyActions>();
  const keyActionType = computed(() => keyAction.value?.type);
  const keyUrl = computed(() => keyAction.value?.keyUrl);
  /**
   * Extracts key type from key url. Works for both .key and .unkey.
   */
  const keyType = computed((): string | undefined => {
    if (!keyUrl.value) {
      return undefined;
    }
    const parts = keyUrl.value.split('/');
    return parts[parts.length - 1].replace(/\.key|\.unkey/g, '');
  });

  const install = async (action: ExternalKeyActions) => {
    console.log('[installKey.install]', action);
    keyInstallStatus.value = 'installing';
    keyAction.value = action;

    if (!keyUrl.value) {
      keyInstallStatus.value = 'failed';
      return console.error('[install] no key to install');
    }

    try {
      const installResponse = await WebguiInstallKey.query({ url: keyUrl.value }).get();
      console.log('[install] WebguiInstallKey installResponse', installResponse);

      keyInstallStatus.value = 'success';
    } catch (error) {
      console.error('[install] WebguiInstallKey error', error);
      let errorMessage = 'Unknown error';
      if (typeof error === 'string') {
        errorMessage = error.toUpperCase();
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      keyInstallStatus.value = 'failed';
      errorsStore.setError({
        heading: 'Failed to install key',
        message: errorMessage,
        level: 'error',
        ref: 'installKey',
        type: 'installKey',
      });
    }
  };

  return {
    // State
    keyInstallStatus,
    // getters
    keyActionType,
    keyType,
    keyUrl,
    // Actions
    install,
  };
});
