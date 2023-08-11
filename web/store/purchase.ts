import { defineStore, createPinia, setActivePinia } from 'pinia';

import { PURCHASE_CALLBACK } from '~/helpers/urls';
import { useCallbackStore } from '~/store/callbackActions';
import { useServerStore } from '~/store/server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const usePurchaseStore = defineStore('purchase', () => {
  const callbackStore = useCallbackStore();
  const serverStore = useServerStore();

  const redeem = () => {
    console.debug('[serverStore.redeem]');
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverPurchasePayload,
        },
        type: 'redeem',
      }],
      serverStore.inIframe,
    );
  };
  const purchase = () => {
    console.debug('[serverStore.purchase]');
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverPurchasePayload,
        },
        type: 'purchase',
      }],
      serverStore.inIframe,
    );
  };
  const upgrade = () => {
    console.debug('[serverStore.upgrade]');
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverPurchasePayload,
        },
        type: 'upgrade',
      }],
      serverStore.inIframe,
    );
  };

  return {
    redeem,
    purchase,
    upgrade,
  };
});
