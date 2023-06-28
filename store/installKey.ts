import { defineStore, createPinia, setActivePinia } from 'pinia';
import { delay } from 'wretch/middlewares';
import { WebguiInstallKey, WebguiUpdateDns } from '~/composables/services/webgui';
import { useServerStore } from '~/store/server';
import type { ExternalKeyActions } from '~/store/callback';
import type { ServerStateDataKeyActions } from '~/types/server'
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useInstallKeyStore = defineStore('installKey', () => {
  const serverStore = useServerStore();

  const keyActionType = ref<ServerStateDataKeyActions>();
  const keyInstalling = ref<boolean | undefined>();
  const keyUrl = ref<string>('');
  const keySuccess = ref<boolean | undefined>();

  /**
   * Extracts key type from key url. Works for both .key and .unkey.
   */
  const keyType = computed((): string | undefined => {
    if (!keyUrl.value) return undefined;
    const parts = keyUrl.value.split('/');
    return parts[parts.length - 1].replace(/\.key|\.unkey/g, '');
  });

  const install = async (action: ExternalKeyActions) => {
    console.debug('[install]');
    keyInstalling.value = true;
    keyActionType.value = action.type;
    keyUrl.value = action.keyUrl;

    if (!keyUrl.value) return console.error('[install] no key to install');

    try {
      const installResponse = await WebguiInstallKey
        .query({ url: keyUrl.value })
        .get();
      console.log('[install] WebguiInstallKey installResponse', installResponse);

      keySuccess.value = true;

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
      keySuccess.value = false;
    } finally {
      keyInstalling.value = false;
    }
  };

  return {
    // State
    keyActionType,
    keyInstalling,
    keySuccess,
    keyUrl,
    // getters
    keyType,
    // Actions
    install,
  };
});
