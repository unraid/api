import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { defineStore, createPinia, setActivePinia } from "pinia";
import { useServerStore } from './server';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useCallbackStore = defineStore('callback', () => {
  const serverStore = useServerStore();
  // store helpers
  // const config = useRuntimeConfig(); // results in a nuxt error after web components are built
  // const encryptKey = config.public.callbackKey;
  const encryptKey = 'Uyv2o8e*FiQe8VeLekTqyX6Z*8XonB';
  console.debug('[useCallbackStore]', { encryptKey });
  // state
  const encryptedMessage = ref('');
  const decryptedData = ref();
  // getters

  // actions
  const send = (url: string = 'https://unraid.ddev.site/init-purchase') => {
    console.debug('[send]');
    const stringifiedData = JSON.stringify({
      ...serverStore.server,
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
    console.debug('[watcher]', currentUrl);
    const callbackValue = currentUrl.searchParams.get('data');
    if (!callbackValue) {
      console.debug('[watcher] no callback to handle');
      return;
    }
    const decryptedMessage = AES.decrypt(callbackValue, encryptKey);
    decryptedData.value = JSON.parse(decryptedMessage.toString(Utf8));
    console.debug('[watcher]', decryptedMessage, decryptedData.value);
    if (!decryptedData.value) return console.error('Callback Watcher: Data not present');
    if (!decryptedData.value.action) return console.error('Callback Watcher: Required "action" not present');
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

  return { send, watcher, decryptedData };
});