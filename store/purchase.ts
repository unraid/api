import { defineStore, createPinia, setActivePinia } from 'pinia';
import { useCallbackStore } from './callbackActions';
import { useServerStore } from './server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const usePurchaseStore = defineStore('purchase', () => {
  const callbackStore = useCallbackStore();
  const serverStore = useServerStore();

  const redeem = () => {
    console.debug('[redeem]');
    callbackStore.send('https://unraid.ddev.site/callback', [{
      server: {
        ...serverStore.serverPurchasePayload,
      },
      type: 'redeem',
    }]);
  };
  const purchase = () => {
    console.debug('[purchase]');
    callbackStore.send('https://unraid.ddev.site/callback', [{
      server: {
        ...serverStore.serverPurchasePayload,
      },
      type: 'purchase',
    }]);
  };
  const upgrade = () => {
    console.debug('[upgrade]');
    callbackStore.send('https://unraid.ddev.site/callback', [{
      server: {
        ...serverStore.serverPurchasePayload,
      },
      type: 'upgrade',
    }]);
  };

  return {
    redeem,
    purchase,
    upgrade,
  };
});
