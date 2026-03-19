import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';

import { useCallback } from '@unraid/shared-callbacks';

import type { ExternalActions, QueryPayloads } from '@unraid/shared-callbacks';
import type { CallbackStatus } from '~/store/callbackActions.helpers';

import { addPreventClose, removePreventClose } from '~/composables/preventClose';
import {
  getCallbackPayloadError,
  getRefreshServerStateOptions,
  isExternalCallbackPayload,
  isSingleUpdateOsActionCallback,
  resolveCallbackCallsCompleted,
  resolveCallbackStatus,
} from '~/store/callbackActions.helpers';
import { useCallbackInboundStore } from '~/store/callbackInbound';
import { useInstallKeyStore } from '~/store/installKey';
import { useServerStore } from '~/store/server';

export const useCallbackActionsStore = defineStore('callbackActions', () => {
  const {
    send,
    watcher: providedWatcher,
    generateUrl,
  } = useCallback({
    encryptionKey: import.meta.env.VITE_CALLBACK_KEY,
  });

  // Lazy store initialization - call stores inside functions to avoid circular dependencies
  const getCallbackInboundStore = () => useCallbackInboundStore();
  const getInstallKeyStore = () => useInstallKeyStore();
  const getServerStore = () => useServerStore();

  const callbackStatus = ref<CallbackStatus>('ready');
  const callbackData = ref<QueryPayloads>();
  const callbackError = ref<string>();
  const callbackActionsExecuting = ref(false);
  const callbackReconciliationPending = ref(false);
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
    await getCallbackInboundStore().executeAction(action);
  };

  const updateResolvedCallbackStatus = () => {
    if (!isExternalCallbackPayload(callbackData.value)) {
      return;
    }

    const nextStatus = resolveCallbackStatus({
      actions: callbackData.value.actions,
      accountActionStatus: getCallbackInboundStore().accountActionStatus,
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
      callbackReconciliationPending.value = true;
      void Promise.resolve(getServerStore().refreshServerState(refreshServerStateOptions)).finally(
        () => {
          callbackReconciliationPending.value = false;
        }
      );
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
    callbackActionsExecuting.value = true;
    try {
      await runCallbackActions(callbackData.value.actions);
    } catch (error) {
      callbackError.value = getCallbackActionErrorMessage(error);
      callbackStatus.value = 'error';
      console.error('[redirectToCallbackType] action failure', error);
    } finally {
      callbackActionsExecuting.value = false;
    }
  };

  const accountActionStatus = computed(() => getCallbackInboundStore().accountActionStatus);
  const keyInstallStatus = computed(() => getInstallKeyStore().keyInstallStatus);
  const callbackCallsCompleted = computed(() =>
    resolveCallbackCallsCompleted({
      callbackActionsExecuting: callbackActionsExecuting.value,
      callbackReconciliationPending: callbackReconciliationPending.value,
    })
  );
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
