import { defineStore } from 'pinia';

import { useAccountStore } from './account';
import { useInstallKeyStore } from './installKey';
import { useCallbackStoreGeneric, type ExternalPayload, type ExternalKeyActions, type QueryPayloads } from './callback';
// import { useServerStore } from './server';

export const useCallbackActionsStore = defineStore(
  'callbackActions',
  () => {
  const accountStore = useAccountStore();
  const installKeyStore = useInstallKeyStore();
  // const serverStore = useServerStore();
  type CallbackStatus = 'error' | 'loading' | 'ready' | 'success';
  const callbackStatus = ref<CallbackStatus>('ready');

  const callbackData = ref<ExternalPayload>();
  const callbackError = ref();
  const callbackFeedbackVisible = ref<boolean>(false);

  const redirectToCallbackType = (decryptedData: QueryPayloads) => {
    console.debug('[redirectToCallbackType]', { decryptedData });

    if (!decryptedData.type || decryptedData.type === 'fromUpc' || !decryptedData.actions?.length) {
      callbackError.value = 'Callback redirect type not present or incorrect';
      callbackStatus.value = 'ready'; // default status
      return console.error('[redirectToCallbackType]', callbackError.value);
    }

    // Display the feedback modal
    callbackData.value = decryptedData;
    callbackStatus.value = 'loading';
    callbackFeedbackVisible.value = true;

    // Parse the data and perform actions
    callbackData.value.actions.forEach(async (action, index, array) => {
      console.debug('[action]', action);
      if (action?.keyUrl) {
        await installKeyStore.install(action as ExternalKeyActions);
      }
      if (action?.user || action.type === 'signOut' || action.type === 'oemSignOut') {
        await accountStore.updatePluginConfig(action);
      }
      // all actions have run
      if (array.length === (index + 1)) {
        // callbackStatus.value = 'done';
        if (array.length > 1) {
          // if we have more than 1 action it means there was a key install and an account action so both need to be successful
          const allSuccess = accountStore.accountActionStatus === 'success' && installKeyStore.keyInstallStatus === 'success';
          callbackStatus.value = allSuccess ? 'success' : 'error';
        } else {
          // only 1 action needs to be successful
          const oneSuccess = accountStore.accountActionStatus === 'success' || installKeyStore.keyInstallStatus === 'success';
          callbackStatus.value = oneSuccess ? 'success' : 'error';
        }
      }
    });
  };

  const setCallbackStatus = (status: CallbackStatus) => callbackStatus.value = status;

  const preventClose = (e: { preventDefault: () => void; returnValue: string; }) => {
    e.preventDefault();
    // eslint-disable-next-line no-param-reassign
    e.returnValue = '';
    // eslint-disable-next-line no-alert
    alert('Closing this pop-up window while actions are being preformed may lead to unintended errors.');
  };

  watch(callbackStatus, (newVal, _oldVal) => {
    console.debug('[callbackStatus]', newVal);
    if (newVal === 'ready') {
      console.debug('[callbackStatus]', newVal, 'addEventListener');
      window.addEventListener('beforeunload', preventClose);
    }
    // removing query string once actions are done so users can't refresh the page and go through the same actions
    if (newVal !== 'ready') {
      console.debug('[callbackStatus]', newVal, 'removeEventListener');
      window.removeEventListener('beforeunload', preventClose);
      console.debug('[callbackStatus] replace history w/o query');
      window.history.replaceState(null, '', window.location.pathname);
    }
  });

  watch(callbackData, () => {
    console.debug('[callbackData] watch', callbackData.value);
  });

  return {
    redirectToCallbackType,
    callbackData,
    callbackFeedbackVisible,
    callbackStatus,
    setCallbackStatus,
  }
});

export const useCallbackStore = useCallbackStoreGeneric(useCallbackActionsStore);
