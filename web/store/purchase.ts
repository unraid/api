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
    console.debug('[redeem]');
    callbackStore.send(PURCHASE_CALLBACK.toString(), [{
      server: {
        ...serverStore.serverPurchasePayload,
      },
      type: 'redeem',
    }]);
  };
  const purchase = () => {
    console.debug('[purchase]');
    callbackStore.send(PURCHASE_CALLBACK.toString(), [{
      server: {
        ...serverStore.serverPurchasePayload,
      },
      type: 'purchase',
    }]);
  };
  const upgrade = () => {
    console.debug('[upgrade]');
    callbackStore.send(PURCHASE_CALLBACK.toString(), [{
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
