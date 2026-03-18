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

  const serverCallbackPayload = computed(() => serverStore.serverCallbackPayload);
  const inIframe = computed(() => serverStore.inIframe);
  const sendType = computed(() => callbackStore.sendType);

  const buildServerPayload = () => {
    const payload = {
      ...serverCallbackPayload.value,
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

  const sendPurchaseAction = (type: PurchaseActionType) => {
    callbackStore.send(
      PURCHASE_CALLBACK.toString(),
      buildActionPayload(type),
      inIframe.value ? 'newTab' : undefined,
      sendType.value
    );
  };

  const activate = () => {
    sendPurchaseAction('activate');
  };
  const redeem = () => {
    sendPurchaseAction('redeem');
  };
  const purchase = () => {
    sendPurchaseAction('purchase');
  };
  const upgrade = () => {
    sendPurchaseAction('upgrade');
  };
  const renew = () => {
    sendPurchaseAction('renew');
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
