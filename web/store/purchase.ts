import { defineStore, createPinia, setActivePinia } from 'pinia';

import { PURCHASE_CALLBACK } from '~/helpers/urls';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useServerStore } from '~/store/server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const usePurchaseStore = defineStore('purchase', () => {
  const callbackStore = useCallbackActionsStore();
  const serverStore = useServerStore();

  const activate = () => {
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverPurchasePayload,
        },
        type: 'activate',
      }],
      serverStore.inIframe ? 'newTab' : undefined,
      callbackStore.sendType,
    );
  };
  const redeem = () => {
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverPurchasePayload,
        },
        type: 'redeem',
      }],
      serverStore.inIframe ? 'newTab' : undefined,
      callbackStore.sendType,
    );
  };
  const purchase = () => {
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverPurchasePayload,
        },
        type: 'purchase',
      }],
      serverStore.inIframe ? 'newTab' : undefined,
      callbackStore.sendType,
    );
  };
  const upgrade = () => {
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverPurchasePayload,
        },
        type: 'upgrade',
      }],
      serverStore.inIframe ? 'newTab' : undefined,
      callbackStore.sendType,
    );
  };
  const renew = () => {
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverPurchasePayload,
        },
        type: 'renew',
      }],
      serverStore.inIframe ? 'newTab' : undefined,
      callbackStore.sendType,
    );
  };

  return {
    activate,
    redeem,
    purchase,
    upgrade,
    renew,
  };
});
