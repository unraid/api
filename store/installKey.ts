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

  const keyUrl = ref<string>('');
  const installing = ref<boolean | undefined>();
  const success = ref<boolean | undefined>();

  const install = async (action: CallbackAction) => {
    console.debug('[install]');
    installing.value = true;
    keyUrl.value = action.keyUrl ?? '';

    try {
      const response = await WebguiInstallKey
        .query({ url: action.keyUrl })
        .get();
      console.log('[install] WebguiInstallKey response', response);
      success.value = true;
      try {
        const response = await WebguiUpdateDns
          .middlewares([
            delay(500)
          ])
          .formUrl({ csrf_token: serverStore.csrf })
          .post();
        console.log('[install] WebguiUpdateDns response', response);
      } catch (error) {
        console.log('[install] WebguiUpdateDns error', error);
      }
    } catch (error) {
      console.log('[install] WebguiInstallKey error', error);
      success.value = false;
    } finally {
      installing.value = false;
    }
  };

  watch(installing, (newV, oldV) => {
    console.debug('[installing.watch]', newV, oldV);
  });

  return {
    // State
    keyUrl,
    installing,
    success,
    // Actions
    install,
  };
});
