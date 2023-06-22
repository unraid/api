import { defineStore } from 'pinia';

import { useAccountStore } from './account';
import { useInstallKeyStore } from './installKey';
import { useCallbackStoreGeneric, type UpcActions, type QueryPayloads } from './callback';
import { useServerStore } from './server';

export const useCallbackActionsStore = defineStore(
  'callbackActions',
  () => {
  const accountStore = useAccountStore();
  const installKeyStore = useInstallKeyStore();
  const serverStore = useServerStore();

  const callbackError = ref();
  const callbackLoading = ref(false);
  const callbackFeedbackVisible = ref<boolean>(false);

  const redirectToCallbackType = (decryptedData: QueryPayloads) => {
    console.debug('[redirectToCallbackType]', { decryptedData });

    if (!decryptedData.type || decryptedData.type === 'fromUpc' || !decryptedData.actions?.length) {
      callbackError.value = 'Callback redirect type not present or incorrect';
      return console.error('[redirectToCallbackType]', callbackError.value);
    }

    // Display the feedback modal
    callbackFeedbackVisible.value = true;
    callbackLoading.value = true;
    // Parse the data and perform actions
    decryptedData.actions.forEach(async (action, index, array) => {
      console.debug('[action]', action);
      if (action?.keyUrl) {
        await installKeyStore.install(action);
      }
      if (action?.user || action.type === 'signOut') {
        await accountStore.updatePluginConfig(action);
      }
      // all actions have run
      if (array.length === (index + 1)) {
        console.debug('[actions] DONE');
        callbackLoading.value = false;
        // setTimeout(() => {
        //   callbackLoading.value = false;
        // }, 1000);
      }
    });
  };

  const closeCallbackFeedback = () => callbackFeedbackVisible.value = false;

  const preventClose = (e: { preventDefault: () => void; returnValue: string; }) => {
    e.preventDefault();
    // eslint-disable-next-line no-param-reassign
    e.returnValue = '';
    // eslint-disable-next-line no-alert
    alert('Closing this pop-up window while actions are being preformed may lead to unintended errors.');
  };

  watch(callbackLoading, (newVal, _oldVal) => {
    console.debug('[callbackLoading]', newVal);
    if (newVal === true) {
      console.debug('[callbackLoading] true', 'addEventListener');
      window.addEventListener('beforeunload', preventClose);
    }
    // removing query string once actions are done so users can't refresh the page and go through the same actions
    if (newVal === false) {
      console.debug('[callbackLoading] false', 'removeEventListener');
      window.removeEventListener('beforeunload', preventClose);
      console.debug('[callbackLoading] push history w/o query');
      window.history.pushState(null, '', window.location.pathname);
    }
  });

  return {
    redirectToCallbackType,
    callbackFeedbackVisible,
    callbackLoading,
    closeCallbackFeedback,
  }
});

export const useCallbackStore = useCallbackStoreGeneric(useCallbackActionsStore);
