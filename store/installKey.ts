import { defineStore, createPinia, setActivePinia } from 'pinia';
import { delay } from 'wretch/middlewares';
import { WebguiInstallKey, WebguiUpdateDns } from '~/composables/services/webgui';
import { useServerStore } from './server';
import type { CallbackAction } from '~/types/callback';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useInstallKeyStore = defineStore('installKey', () => {
  const serverStore = useServerStore();

  //	"https://keys.lime-technology.com/unraid/c9785e151ae3b0f056238e403809fd28b82eb4ad/Plus.key"
  const keyUrl = ref<string>('');
  const installing = ref<boolean | undefined>();
  const success = ref<boolean | undefined>();

  const keyType = computed((): string | undefined => {
    if (!keyUrl.value) return undefined;
    const parts = keyUrl.value.split('/');
    return parts[parts.length - 1].replace('.key', '');
  });

  const install = async (action: CallbackAction) => {
    console.debug('[install]');
    installing.value = true;
    keyUrl.value = action.keyUrl ?? '';

    if (!keyUrl.value) return console.error('[install] no key to install');

    try {
      const response = await WebguiInstallKey
        .query({ url: keyUrl.value })
        .get();
      console.log('[install] WebguiInstallKey response', response);
      success.value = true;
      try {
        const response = await WebguiUpdateDns
          .middlewares([
            delay(1500)
          ])
          .formUrl({ csrf_token: serverStore.csrf })
          .post();
        console.log('[install] WebguiUpdateDns response', response);
      } catch (error) {
        console.error('[install] WebguiUpdateDns error', error);
      }
    } catch (error) {
      console.error('[install] WebguiInstallKey error', error);
      success.value = false;
    } finally {
      installing.value = false;
    }
  };

  return {
    // State
    keyUrl,
    installing,
    success,
    // getters
    keyType,
    // Actions
    install,
  };
});
