import { defineStore, createPinia, setActivePinia } from 'pinia';
import { delay } from 'wretch/middlewares';
import { WebguiInstallKey, WebguiUpdateDns } from '~/composables/services/webgui';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
import type { ExternalKeyActions } from '~/store/callback';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useInstallKeyStore = defineStore('installKey', () => {
  const errorsStore = useErrorsStore();
  const serverStore = useServerStore();

  const keyInstallStatus = ref<'failed' | 'installing' | 'ready' | 'success'>('ready');

  const keyAction = ref<ExternalKeyActions>();
  const keyActionType = computed(() => keyAction.value?.type);
  const keyUrl = computed(() => keyAction.value?.keyUrl);
  /**
   * Extracts key type from key url. Works for both .key and .unkey.
   */
  const keyType = computed((): string | undefined => {
    if (!keyUrl.value) { return undefined; }
    const parts = keyUrl.value.split('/');
    return parts[parts.length - 1].replace(/\.key|\.unkey/g, '');
  });

  const install = async (action: ExternalKeyActions) => {
    console.debug('[install]');
    keyInstallStatus.value = 'installing';
    keyAction.value = action;

    if (!keyUrl.value) { return console.error('[install] no key to install'); }

    try {
      const installResponse = await WebguiInstallKey
        .query({ url: keyUrl.value })
        .get();
      console.log('[install] WebguiInstallKey installResponse', installResponse);

      keyInstallStatus.value = 'success';

      try {
        const updateDnsResponse = await WebguiUpdateDns
          .middlewares([
            delay(1500)
          ])
          .formUrl({ csrf_token: serverStore.csrf })
          .post();
        console.log('[install] WebguiUpdateDns updateDnsResponse', updateDnsResponse);
      } catch (error) {
        console.error('[install] WebguiUpdateDns error', error);
      }
    } catch (error) {
      console.error('[install] WebguiInstallKey error', error);
      keyInstallStatus.value = 'failed';
      errorsStore.setError({
        heading: 'Failed to install key',
        message: error.message,
        level: 'error',

        ref: 'installKey',
        type: 'installKey',
      });
    }
  };

  watch(keyInstallStatus, (newV, oldV) => {
    console.debug('[keyInstallStatus]', newV, oldV);
  });

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
