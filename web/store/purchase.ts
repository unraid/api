import { computed } from 'vue';
import { createPinia, defineStore, setActivePinia, storeToRefs } from 'pinia';

import { PURCHASE_CALLBACK } from '~/helpers/urls';

import type { ServerData } from '@unraid/shared-callbacks';

import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
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

  const serverPurchasePayload = computed(() => serverStore.serverPurchasePayload);
  const inIframe = computed(() => serverStore.inIframe);
  const sendType = computed(() => callbackStore.sendType);

  const activate = () => {
    const { activationCode } = storeToRefs(useActivationCodeDataStore());

    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      [
        {
          /**
           * @todo Remove the type cast once the payload type can be more specific.
           */
          server: {
            ...serverPurchasePayload.value,
            activationCodeData: activationCode.value,
          } as unknown as ServerData,
          type: 'activate',
        },
      ],
      inIframe.value ? 'newTab' : undefined,
      sendType.value
    );
  };
  const redeem = () => {
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      [
        {
          server: {
            ...serverPurchasePayload.value,
          },
          type: 'redeem',
        },
      ],
      inIframe.value ? 'newTab' : undefined,
      sendType.value
    );
  };
  const purchase = () => {
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      [
        {
          server: {
            ...serverPurchasePayload.value,
          },
          type: 'purchase',
        },
      ],
      inIframe.value ? 'newTab' : undefined,
      sendType.value
    );
  };
  const upgrade = () => {
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      [
        {
          server: {
            ...serverPurchasePayload.value,
          },
          type: 'upgrade',
        },
      ],
      inIframe.value ? 'newTab' : undefined,
      sendType.value
    );
  };
  const renew = () => {
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      [
        {
          server: {
            ...serverPurchasePayload.value,
          },
          type: 'renew',
        },
      ],
      inIframe.value ? 'newTab' : undefined,
      sendType.value
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
