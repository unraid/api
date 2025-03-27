import { createPinia, defineStore, setActivePinia } from 'pinia';

import { useCallback } from '@unraid/shared-callbacks';

import type {
  ExternalActions,
  ExternalKeyActions,
  ExternalSignIn,
  ExternalSignOut,
  ExternalUpdateOsAction,
  QueryPayloads,
} from '@unraid/shared-callbacks';

import { addPreventClose, removePreventClose } from '~/composables/preventClose';
import { useAccountStore } from '~/store/account';
import { useInstallKeyStore } from '~/store/installKey';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

type CallbackStatus = 'closing' | 'error' | 'loading' | 'ready' | 'success';

setActivePinia(createPinia());

export const useCallbackActionsStore = defineStore('callbackActions', () => {
  const { send, watcher: providedWatcher } = useCallback({
    encryptionKey: import.meta.env.VITE_CALLBACK_KEY,
  });
  const accountStore = useAccountStore();
  const installKeyStore = useInstallKeyStore();
  const serverStore = useServerStore();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateOsStore = useUpdateOsStore(); // if we remove this line, the store things break…
  const updateOsActionsStore = useUpdateOsActionsStore();

  const callbackStatus = ref<CallbackStatus>('ready');
  const callbackData = ref<QueryPayloads>();
  const callbackError = ref();

  const watcher = () => {
    const result = providedWatcher();
    if (result) {
      saveCallbackData(result);
    }
  };

  const saveCallbackData = (decryptedData?: QueryPayloads) => {
    if (decryptedData) {
      callbackData.value = decryptedData;
    }

    if (!callbackData.value) {
      return console.error('Saved callback data not found');
    }

    redirectToCallbackType?.();
  };

  const actionTypesWithKey = [
    'recover',
    'replace',
    'trialExtend',
    'trialStart',
    'purchase',
    'redeem',
    'renew',
    'upgrade',
  ];

  const redirectToCallbackType = () => {
    console.debug('[redirectToCallbackType]');
    if (
      !callbackData.value ||
      !callbackData.value.type ||
      callbackData.value.type !== 'forUpc' ||
      !callbackData.value.actions?.length
    ) {
      callbackError.value = 'Callback redirect type not present or incorrect';
      callbackStatus.value = 'ready'; // default status
      return console.error('[redirectToCallbackType]', callbackError.value);
    }
    // Display the feedback modal
    callbackStatus.value = 'loading';

    // Parse the data and perform actions
    callbackData.value.actions.forEach(
      async (action: ExternalActions, index: number, array: ExternalActions[]) => {
        console.debug('[redirectToCallbackType]', { action, index, array });

        if (actionTypesWithKey.includes(action.type)) {
          await installKeyStore.install(action as ExternalKeyActions);
        }

        if (action.type === 'signIn' && action?.user) {
          accountStore.setAccountAction(action as ExternalSignIn);
          await accountStore.setConnectSignInPayload({
            apiKey: action?.apiKey ?? '',
            email: action.user?.email ?? '',
            preferred_username: action.user?.preferred_username ?? '',
          });
        }

        if (action.type === 'signOut' || action.type === 'oemSignOut') {
          accountStore.setAccountAction(action as ExternalSignOut);
          await accountStore.setQueueConnectSignOut(true);
        }

        if (action.type === 'updateOs' || action.type === 'downgradeOs') {
          updateOsActionsStore.setUpdateOsAction(action as ExternalUpdateOsAction);
          await updateOsActionsStore.actOnUpdateOsAction(action.type === 'downgradeOs');

          if (array.length === 1) {
            // only 1 action, skip refresh server state
            console.debug('[redirectToCallbackType] updateOs done');
            // removing query string relase is set so users can't refresh the page and go through the same actions
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
        }

        if (array.length === index + 1) {
          // all actions have run
          await serverStore.refreshServerState();
        }
      }
    );
  };

  // Wait until we have a refreshServerStateStatus value to determine callbackStatus
  const refreshServerStateStatus = computed(() => serverStore.refreshServerStateStatus);
  watchEffect(() => {
    if (callbackData.value?.actions && refreshServerStateStatus.value === 'done') {
      if (callbackData.value.actions.length > 1) {
        // if we have more than 1 action it means there was a key install and an account action so both need to be successful
        const allSuccess =
          accountStore.accountActionStatus === 'success' &&
          installKeyStore.keyInstallStatus === 'success';
        callbackStatus.value = allSuccess ? 'success' : 'error';
      } else {
        // only 1 action needs to be successful
        const oneSuccess =
          accountStore.accountActionStatus === 'success' ||
          installKeyStore.keyInstallStatus === 'success';
        callbackStatus.value = oneSuccess ? 'success' : 'error';
      }
    }
    /** @todo ensure timeout messaging is correct */
    if (callbackData.value?.actions && refreshServerStateStatus.value === 'timeout') {
      callbackStatus.value = 'error';
    }
  });

  const setCallbackStatus = (status: CallbackStatus) => {
    callbackStatus.value = status;
  };

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
    send,
    watcher,
    // helpers
    sendType: 'fromUpc',
    encryptionKey: import.meta.env.VITE_CALLBACK_KEY,
  };
});
