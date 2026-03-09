import { computed, ref, watch, watchEffect } from 'vue';
import { defineStore } from 'pinia';

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
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

type CallbackStatus = 'closing' | 'error' | 'loading' | 'ready' | 'success';

const keyActionTypes = [
  'recover',
  'replace',
  'trialExtend',
  'trialStart',
  'purchase',
  'redeem',
  'renew',
  'upgrade',
] as const;

const accountActionTypes = ['signIn', 'signOut', 'oemSignOut'] as const;
const updateOsActionTypes = ['updateOs', 'downgradeOs'] as const;

export const useCallbackActionsStore = defineStore('callbackActions', () => {
  const {
    send,
    watcher: providedWatcher,
    generateUrl,
  } = useCallback({
    encryptionKey: import.meta.env.VITE_CALLBACK_KEY,
  });

  // Lazy store initialization - call stores inside functions to avoid circular dependencies
  const getAccountStore = () => useAccountStore();
  const getInstallKeyStore = () => useInstallKeyStore();
  const getServerStore = () => useServerStore();
  const getUpdateOsActionsStore = () => useUpdateOsActionsStore();

  const callbackStatus = ref<CallbackStatus>('ready');
  const callbackData = ref<QueryPayloads>();
  const callbackError = ref();
  const sendType = 'fromUpc';

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
    callbackData.value.actions.forEach(async (action: ExternalActions, index: number, array) => {
      console.debug('[redirectToCallbackType]', { action, index, array });

      if (keyActionTypes.includes(action.type)) {
        await getInstallKeyStore().install(action as ExternalKeyActions);
      }

      if (action.type === 'signIn' && action?.user) {
        const accountStore = getAccountStore();
        accountStore.setAccountAction(action as ExternalSignIn);
        await accountStore.setConnectSignInPayload({
          apiKey: action?.apiKey ?? '',
          email: action.user?.email ?? '',
          preferred_username: action.user?.preferred_username ?? '',
        });
      }

      if (action.type === 'signOut' || action.type === 'oemSignOut') {
        const accountStore = getAccountStore();
        accountStore.setAccountAction(action as ExternalSignOut);
        await accountStore.setQueueConnectSignOut(true);
      }

      if (action.type === 'updateOs' || action.type === 'downgradeOs') {
        const updateOsActionsStore = getUpdateOsActionsStore();
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
        const shouldRefreshServerState = array.some(
          (callbackAction) =>
            accountActionTypes.includes(callbackAction.type) ||
            updateOsActionTypes.includes(callbackAction.type)
        );

        if (shouldRefreshServerState) {
          await getServerStore().refreshServerState();
        }
      }
    });
  };

  const hasKeyAction = computed(() =>
    Boolean(callbackData.value?.actions?.some((action) => keyActionTypes.includes(action.type)))
  );
  const hasAccountAction = computed(() =>
    Boolean(callbackData.value?.actions?.some((action) => accountActionTypes.includes(action.type)))
  );
  const hasUpdateOsAction = computed(() =>
    Boolean(callbackData.value?.actions?.some((action) => updateOsActionTypes.includes(action.type)))
  );

  const refreshServerStateStatus = computed(() => getServerStore().refreshServerStateStatus);
  watchEffect(() => {
    if (!callbackData.value?.actions?.length) {
      return;
    }

    const accountStore = getAccountStore();
    const installKeyStore = getInstallKeyStore();
    const accountStatus = accountStore.accountActionStatus;
    const keyStatus = installKeyStore.keyInstallStatus;

    if (
      (hasKeyAction.value && keyStatus === 'failed') ||
      (hasAccountAction.value && accountStatus === 'failed')
    ) {
      callbackStatus.value = 'error';
      return;
    }

    if (hasUpdateOsAction.value) {
      if (refreshServerStateStatus.value === 'done') {
        callbackStatus.value = 'success';
        return;
      }

      if (refreshServerStateStatus.value === 'timeout') {
        callbackStatus.value = 'error';
      }

      return;
    }

    const keyActionSucceeded = !hasKeyAction.value || keyStatus === 'success';
    const accountActionSucceeded = !hasAccountAction.value || accountStatus === 'success';

    if (keyActionSucceeded && accountActionSucceeded) {
      callbackStatus.value = 'success';
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
    generateUrl,
    // helpers
    sendType,
    encryptionKey: import.meta.env.VITE_CALLBACK_KEY,
    callbackError,
  };
});
