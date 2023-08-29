import { defineStore } from 'pinia';

import { addPreventClose, removePreventClose } from '~/composables/preventClose';
import { useAccountStore } from '~/store/account';
import { useInstallKeyStore } from '~/store/installKey';
import { useServerStore } from '~/store/server';
import { useCallbackStoreGeneric, type CallbackActionsStore, type ExternalKeyActions, type QueryPayloads } from '~/store/callback';

export const useCallbackActionsStore = defineStore('callbackActions', () => {
  const accountStore = useAccountStore();
  const installKeyStore = useInstallKeyStore();
  const serverStore = useServerStore();

  type CallbackStatus = 'closing' | 'error' | 'loading' | 'ready' | 'success';
  const callbackStatus = ref<CallbackStatus>('ready');

  const callbackData = ref<QueryPayloads>();
  const callbackError = ref();

  const saveCallbackData = (
    decryptedData?: QueryPayloads,
  ) => {
    if (decryptedData) {
      callbackData.value = decryptedData;
    }

    if (!callbackData.value) {
      return console.error('Saved callback data not found');
    }

    redirectToCallbackType?.();
  };

  const redirectToCallbackType = () => {
    if (!callbackData.value || !callbackData.value.type || callbackData.value.type !== 'forUpc' || !callbackData.value.actions?.length) {
      callbackError.value = 'Callback redirect type not present or incorrect';
      callbackStatus.value = 'ready'; // default status
      return console.error('[redirectToCallbackType]', callbackError.value);
    }
    // Display the feedback modal
    callbackStatus.value = 'loading';

    // Parse the data and perform actions
    callbackData.value.actions.forEach(async (action, index, array) => {
      if (action?.keyUrl) {
        await installKeyStore.install(action as ExternalKeyActions);
      }
      if (action?.user || action.type === 'signOut' || action.type === 'oemSignOut') {
        await accountStore.updatePluginConfig(action);
      }
      // all actions have run
      if (array.length === (index + 1)) {
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

  const setCallbackStatus = (status: CallbackStatus) => { callbackStatus.value = status; };

  watch(callbackStatus, (newVal, oldVal) => {
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
    // state
    callbackData,
    callbackStatus,
    // actions
    redirectToCallbackType,
    saveCallbackData,
    setCallbackStatus,
    // helpers
    sendType: 'fromUpc',
    encryptionKey: import.meta.env.VITE_CALLBACK_KEY,
  };
});

export const useCallbackStore = useCallbackStoreGeneric(useCallbackActionsStore as unknown as () => CallbackActionsStore);
