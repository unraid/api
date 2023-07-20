import { defineStore } from 'pinia';

import { addPreventClose, removePreventClose } from '~/composables/preventClose';
import { useAccountStore } from '~/store/account';
import { useInstallKeyStore } from '~/store/installKey';
import { useServerStore } from '~/store/server';
import { useCallbackStoreGeneric, type ExternalPayload, type ExternalKeyActions, type QueryPayloads } from '~/store/callback';

export const useCallbackActionsStore = defineStore(
  'callbackActions',
  () => {
  const accountStore = useAccountStore();
  const installKeyStore = useInstallKeyStore();
  const serverStore = useServerStore();

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
        /** @todo refresh server state until we have new data */
        await serverStore.refreshServerState();
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

  watch(callbackStatus, (newVal, oldVal) => {
    console.debug('[callbackStatus]', newVal);
    if (newVal === 'loading') {
      addPreventClose();
    }
    if (oldVal === 'loading') {
      removePreventClose();
      // removing query string once actions are done so users can't refresh the page and go through the same actions
      window.history.replaceState(null, '', window.location.pathname);
    }
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
