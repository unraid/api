import { defineStore } from 'pinia';

import { addPreventClose, removePreventClose } from '~/composables/preventClose';
import { useAccountStore } from '~/store/account';
import { useInstallKeyStore } from '~/store/installKey';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore, useUpdateOsActionsStore } from '~/store/updateOsActions';
import { useCallbackStoreGeneric, type CallbackActionsStore, type ExternalKeyActions, type QueryPayloads } from '~/store/callback';

export const useCallbackActionsStore = defineStore('callbackActions', () => {
  const accountStore = useAccountStore();
  const installKeyStore = useInstallKeyStore();
  const serverStore = useServerStore();
  const updateOsStore = useUpdateOsStore();
  const updateOsActionsStore = useUpdateOsActionsStore();

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

  const redirectToCallbackType = async () => {
    console.debug('[redirectToCallbackType]');
    if (!callbackData.value || !callbackData.value.type || callbackData.value.type !== 'forUpc' || !callbackData.value.actions?.length) {
      callbackError.value = 'Callback redirect type not present or incorrect';
      callbackStatus.value = 'ready'; // default status
      return console.error('[redirectToCallbackType]', callbackError.value);
    }
    // Display the feedback modal
    callbackStatus.value = 'loading';

    // Parse the data and perform actions
    callbackData.value.actions.forEach(async (action, index, array) => {
      console.debug('[redirectToCallbackType]', { action, index, array });

      if (action?.keyUrl) {
        await installKeyStore.install(action as ExternalKeyActions);
      }
      if (action?.user || action.type === 'signIn') {
        accountStore.setAccountAction(action);
        accountStore.setConnectSignInPayload({
          apiKey: action.apiKey,
          email: action.user.email,
          preferred_username: action.user.preferred_username,
        });
      }
      if (action.type === 'signOut' || action.type === 'oemSignOut') {
        accountStore.setAccountAction(action);
        accountStore.setQueueConnectSignOut(true);
      }

      if (action.type === 'updateOs' && action?.sha256) {
        console.debug('[redirectToCallbackType] updateOs', action);
        const foundRelease = await updateOsActionsStore.getReleaseFromKeyServer(action.sha256);
        console.debug('[redirectToCallbackType] updateOs foundRelease', foundRelease);
        if (!foundRelease) {
          throw new Error('Release not found');
        }
        if (foundRelease.version === serverStore.osVersion) {
          throw new Error('Release version is the same as the server\'s current version');
        }
        updateOsActionsStore.confirmUpdateOs(foundRelease);
        if (array.length === 1) { // only 1 action, skip refresh server state
          console.debug('[redirectToCallbackType] updateOs done');
          // removing query string relase is set so users can't refresh the page and go through the same actions
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }
      }

      if (array.length === (index + 1)) { // all actions have run
        await serverStore.refreshServerState();
        // callbackStatus.value = 'done';
      }
    });
  };
  // Wait until we have a refreshServerStateStatus value to determine callbackStatus
  const refreshServerStateStatus = computed(() => serverStore.refreshServerStateStatus);
  watchEffect(() => {
    if (callbackData.value?.actions && refreshServerStateStatus.value === 'done') {
      if (callbackData.value.actions.length > 1) {
        // if we have more than 1 action it means there was a key install and an account action so both need to be successful
        const allSuccess = accountStore.accountActionStatus === 'success' && installKeyStore.keyInstallStatus === 'success';
        callbackStatus.value = allSuccess ? 'success' : 'error';
      } else {
        // only 1 action needs to be successful
        const oneSuccess = accountStore.accountActionStatus === 'success' || installKeyStore.keyInstallStatus === 'success';
        callbackStatus.value = oneSuccess ? 'success' : 'error';
      }
    }
    /** @todo ensure timeout messaging is correct */
    if (callbackData.value?.actions && refreshServerStateStatus.value === 'timeout') {
      callbackStatus.value = 'error';
    }
  });

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
