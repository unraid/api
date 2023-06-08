import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import { useAccountStore } from './account';
import { useInstallKeyStore } from './installKey';
import type { CallbackSendPayload, CallbackReceivePayload } from '~/types/callback';
import type {
  ServerAccountCallbackSendPayload,
  ServerPurchaseCallbackSendPayload,
} from '~/types/server';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useCallbackStore = defineStore('callback', () => {
  // store helpers
  const accountStore = useAccountStore();
  const installKeyStore = useInstallKeyStore();
  // const config = useRuntimeConfig(); // results in a nuxt error after web components are built
  // const encryptKey = config.public.callbackKey;
  const encryptKey = 'Uyv2o8e*FiQe8VeLekTqyX6Z*8XonB';
  // state
  const callbackFeedbackVisible = ref<boolean>(false);
  const callbackLoading = ref(false);
  const decryptedData = ref<CallbackReceivePayload|null>(null);
  const encryptedMessage = ref<string|null>(null);
  // actions
  const send = (url: string = 'https://unraid.ddev.site/init-purchase', payload: CallbackSendPayload) => {
    console.debug('[send]');
    const stringifiedData = JSON.stringify({
      ...payload,
      sender: window.location.href,
    });
    encryptedMessage.value = AES.encrypt(stringifiedData, encryptKey).toString();
    // build and go to url
    const destinationUrl = new URL(url);
    console.debug('[send]', encryptedMessage.value, url);
    destinationUrl.searchParams.set('data', encryptedMessage.value);
    window.location.href = destinationUrl.toString();
  };

  const watcher = () => {
    console.debug('[watcher]');
    const currentUrl = new URL(window.location.toString());
    const callbackValue = currentUrl.searchParams.get('data');
    console.debug('[watcher]', { callbackValue });
    if (!callbackValue) {
      return console.debug('[watcher] no callback to handle');
    }
    callbackLoading.value = true;
    const decryptedMessage = AES.decrypt(callbackValue, encryptKey);
    decryptedData.value = JSON.parse(decryptedMessage.toString(Utf8));
    console.debug('[watcher]', decryptedMessage, decryptedData.value);
    if (!decryptedData.value) {
      callbackLoading.value = false;
      return console.error('Callback Watcher: Data not present');
    }
    if (!decryptedData.value.actions) {
      callbackLoading.value = false;
      return console.error('Callback Watcher: Required "action" not present');
    }
    // Display the feedback modal
    show();
    // Parse the data and perform actions
    decryptedData.value.actions.forEach(async (action, index, array) => {
      console.debug('[action]', action);
      if (action.keyUrl) {
        const response = await installKeyStore.install(action);
        console.debug('[action] installKeyStore.install response', response);
      }
      if (action.user) {
        const response = await accountStore.updatePluginConfig(action);
        console.debug('[action] accountStore.updatePluginConfig', response);
      }
      // all actions have run
      if (array.length === (index + 1)) {
        console.debug('[actions] DONE');
        setTimeout(() => {
          callbackLoading.value = false;
        }, 5000);
      }
    });
  };

  const hide = () => {
    console.debug('[hide]');
    callbackFeedbackVisible.value = false;
  };
  const show = () => {
    console.debug('[show]');
    callbackFeedbackVisible.value = true;
  }
  const toggle = useToggle(callbackFeedbackVisible);

  watch(callbackFeedbackVisible, (newVal, _oldVal) => {
    console.debug('[callbackFeedbackVisible]', newVal);
    // removing query string once actions are done so users can't refresh the page and go through the same actions
    if (newVal === false) {
      console.debug('[callbackFeedbackVisible] push history w/o query');
      window.history.pushState(null, '', window.location.pathname);
    }
  });

  return {
    // state
    callbackFeedbackVisible,
    callbackLoading,
    decryptedData,
    // actions
    send,
    watcher,
    hide,
    show,
    toggle,
  };
});