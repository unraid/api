import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';

import { useCallback } from '@unraid/shared-callbacks';

import type { ExternalActions, QueryPayloads } from '@unraid/shared-callbacks';
import type { CallbackStatus } from '~/store/callbackActions.helpers';

import { addPreventClose, removePreventClose } from '~/composables/preventClose';
import { useAccountStore } from '~/store/account';
import {
  getCallbackPayloadError,
  getRefreshServerStateOptions,
  isAccountSignInAction,
  isAccountSignOutAction,
  isExternalCallbackPayload,
  isKeyAction,
  isSingleUpdateOsActionCallback,
  isUpdateOsAction,
  resolveCallbackStatus,
} from '~/store/callbackActions.helpers';
import { useInstallKeyStore } from '~/store/installKey';
import { useServerStore } from '~/store/server';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

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
  const callbackError = ref<string>();
  const sendType = 'fromUpc';

  const getCallbackActionErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown callback action error';
  };

  const watcher = () => {
    const result = providedWatcher();
    if (result) {
      void saveCallbackData(result);
    }
  };

  const saveCallbackData = async (decryptedData?: QueryPayloads) => {
    if (decryptedData) {
      callbackData.value = decryptedData;
    }

    if (!callbackData.value) {
      return console.error('Saved callback data not found');
    }

    return redirectToCallbackType();
  };

  const executeCallbackAction = async (action: ExternalActions) => {
    if (isKeyAction(action)) {
      await getInstallKeyStore().install(action);
      return;
    }

    if (isAccountSignInAction(action)) {
      const accountStore = getAccountStore();
      accountStore.setAccountAction(action);
      await accountStore.setConnectSignInPayload({
        apiKey: action.apiKey ?? '',
        email: action.user.email ?? '',
        preferred_username: action.user.preferred_username ?? '',
      });
      return;
    }

    if (isAccountSignOutAction(action)) {
      const accountStore = getAccountStore();
      accountStore.setAccountAction(action);
      await accountStore.setQueueConnectSignOut(true);
      return;
    }

    if (isUpdateOsAction(action)) {
      const updateOsActionsStore = getUpdateOsActionsStore();
      updateOsActionsStore.setUpdateOsAction(action);
      await updateOsActionsStore.actOnUpdateOsAction(action.type === 'downgradeOs');
    }
  };

  const updateResolvedCallbackStatus = () => {
    if (!isExternalCallbackPayload(callbackData.value)) {
      return;
    }

    const nextStatus = resolveCallbackStatus({
      actions: callbackData.value.actions,
      accountActionStatus: getAccountStore().accountActionStatus,
      keyInstallStatus: getInstallKeyStore().keyInstallStatus,
    });

    if (nextStatus) {
      callbackStatus.value = nextStatus;
    }
  };

  const runCallbackActions = async (actions: ExternalActions[]) => {
    for (const action of actions) {
      console.debug('[redirectToCallbackType] actionType', action.type);
      await executeCallbackAction(action);
    }

    const refreshServerStateOptions = getRefreshServerStateOptions(actions);
    if (refreshServerStateOptions) {
      void getServerStore().refreshServerState(refreshServerStateOptions);
    }

    if (isSingleUpdateOsActionCallback(actions)) {
      console.debug('[redirectToCallbackType] updateOs done');
      window.history.replaceState(null, '', window.location.pathname);
    }

    updateResolvedCallbackStatus();
  };

  const redirectToCallbackType = async () => {
    console.debug('[redirectToCallbackType]');
    callbackError.value = getCallbackPayloadError(callbackData.value);
    if (!isExternalCallbackPayload(callbackData.value)) {
      callbackStatus.value = 'ready';
      return console.error('[redirectToCallbackType]', callbackError.value);
    }
    callbackStatus.value = 'loading';
    try {
      await runCallbackActions(callbackData.value.actions);
    } catch (error) {
      callbackError.value = getCallbackActionErrorMessage(error);
      callbackStatus.value = 'error';
      console.error('[redirectToCallbackType] action failure', error);
    }
  };

  const accountActionStatus = computed(() => getAccountStore().accountActionStatus);
  const keyInstallStatus = computed(() => getInstallKeyStore().keyInstallStatus);
  const refreshServerStateStatus = computed(() => getServerStore().refreshServerStateStatus);
  const callbackCallsCompleted = computed(() => {
    if (callbackStatus.value === 'loading') {
      return false;
    }

    if (!isExternalCallbackPayload(callbackData.value)) {
      return true;
    }

    if (!getRefreshServerStateOptions(callbackData.value.actions)) {
      return true;
    }

    return refreshServerStateStatus.value === 'done' || refreshServerStateStatus.value === 'timeout';
  });
  watch([callbackData, accountActionStatus, keyInstallStatus], updateResolvedCallbackStatus);

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
    callbackCallsCompleted,
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
