import { computed } from 'vue';
import { defineStore, storeToRefs } from 'pinia';

import { PURCHASE_CALLBACK } from '~/helpers/urls';

import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useServerStore } from '~/store/server';

export const usePurchaseStore = defineStore('purchase', () => {
  const callbackStore = useCallbackActionsStore();
  const serverStore = useServerStore();
  const { activationCode } = storeToRefs(useActivationCodeDataStore());

  const serverPurchasePayload = computed(() => serverStore.serverPurchasePayload);
  const inIframe = computed(() => serverStore.inIframe);
  const sendType = computed(() => callbackStore.sendType);

  const buildServerPayload = () => {
    const payload = {
      ...serverPurchasePayload.value,
    };
    if (activationCode.value) {
      const { code, partner, system } = activationCode.value;
      const activationCodeData = {
        ...(code ? { code } : {}),
        ...(partner ? { partner } : {}),
        ...(system ? { system } : {}),
      };

      return {
        ...payload,
        activationCodeData: Object.keys(activationCodeData).length ? activationCodeData : null,
      };
    }
    return payload;
  };

  type PurchaseActionType = 'activate' | 'redeem' | 'purchase' | 'upgrade' | 'renew';

  const buildActionPayload = (type: PurchaseActionType) => [
    {
      /**
       * @todo Remove the type cast once the payload type can be more specific.
       */
      server: buildServerPayload(),
      type,
    },
  ];

  const generateUrl = (type: PurchaseActionType) => {
    return callbackStore.generateUrl(
      PURCHASE_CALLBACK.toString(),
      buildActionPayload(type),
      sendType.value,
      undefined
    );
  };

  const activate = () => {
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      buildActionPayload('activate'),
      inIframe.value ? 'newTab' : undefined,
      sendType.value
    );
  };
  const redeem = () => {
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      buildActionPayload('redeem'),
      inIframe.value ? 'newTab' : undefined,
      sendType.value
    );
  };
  const purchase = () => {
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      buildActionPayload('purchase'),
      inIframe.value ? 'newTab' : undefined,
      sendType.value
    );
  };
  const upgrade = () => {
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      buildActionPayload('upgrade'),
      inIframe.value ? 'newTab' : undefined,
      sendType.value
    );
  };
  const renew = () => {
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      buildActionPayload('renew'),
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
    generateUrl,
    openInNewTab: computed(() => inIframe.value),
  };
});
