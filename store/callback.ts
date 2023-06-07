import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { defineStore, createPinia, setActivePinia } from "pinia";
import type { CallbackSendPayload } from '~/types/callback';
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
  // const config = useRuntimeConfig(); // results in a nuxt error after web components are built
  // const encryptKey = config.public.callbackKey;
  const encryptKey = 'Uyv2o8e*FiQe8VeLekTqyX6Z*8XonB';
  // state
  const currentUrl = ref();
  const callbackFeedbackVisible = ref<boolean>(false);
  const decryptedData = ref();
  const encryptedMessage = ref('');
  // actions
  const send = (url: string = 'https://unraid.ddev.site/init-purchase', payload: CallbackSendPayload) => {
    console.debug('[send]');
    const stringifiedData = JSON.stringify({
      ...payload,
      sender: window.location.href,
    });
    // @todo don't save to store
    encryptedMessage.value = AES.encrypt(stringifiedData, encryptKey).toString();
    // build and go to url
    const destinationUrl = new URL(url);
    console.debug('[send]', encryptedMessage.value, url);
    destinationUrl.searchParams.set('data', encryptedMessage.value);
    window.location.href = destinationUrl;
  };

  const watcher = () => {
    console.debug('[watcher]');
    const currentUrl = new URL(window.location);
    const callbackValue = currentUrl.searchParams.get('data');
    console.debug('[watcher]', { callbackValue });
    if (!callbackValue) {
      return console.debug('[watcher] no callback to handle');
    }
    const decryptedMessage = AES.decrypt(callbackValue, encryptKey);
    decryptedData.value = JSON.parse(decryptedMessage.toString(Utf8));
    console.debug('[watcher]', decryptedMessage, decryptedData.value);
    if (!decryptedData.value) return console.error('Callback Watcher: Data not present');
    if (!decryptedData.value.action) return console.error('Callback Watcher: Required "action" not present');
    // Display the feedback modal
    show();
    // Parse the data and perform actions
    switch (decryptedData.value.action) {
      case 'install':
        console.debug(`Installing key ${decryptedData.value.keyUrl}\n\nOEM: ${decryptedData.value.oem}\n\nSender: ${decryptedData.value.sender}`);
        break;
      case 'register':
        console.debug('[Register action]');
        break;
      default:
        console.error('Callback Watcher: Invalid "action"');
        break;
    }
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
    decryptedData,
    callbackFeedbackVisible,
    // actions
    send,
    watcher,
    hide,
    show,
    toggle,
  };
});