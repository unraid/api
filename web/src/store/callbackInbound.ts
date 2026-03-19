import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useMutation } from '@vue/apollo-composable';
import { logErrorMessages } from '@vue/apollo-util';

import type {
  ExternalActions,
  ExternalSignIn,
  ExternalSignOut,
  ExternalUpdateOsAction,
} from '@unraid/shared-callbacks';
import type {
  ConnectSignInMutation,
  ConnectSignInMutationVariables,
  SignOutMutation,
} from '~/composables/gql/graphql';
import type { CallbackAccountStatus } from '~/store/callbackActions.helpers';

import { CONNECT_SIGN_IN, CONNECT_SIGN_OUT } from '~/store/account.fragment';
import {
  isAccountSignInAction,
  isAccountSignOutAction,
  isKeyAction,
  isUpdateOsAction,
} from '~/store/callbackActions.helpers';
import { useErrorsStore } from '~/store/errors';
import { useInstallKeyStore } from '~/store/installKey';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

export const useCallbackInboundStore = defineStore('callbackInbound', () => {
  const errorsStore = useErrorsStore();
  const installKeyStore = useInstallKeyStore();
  const updateOsActionsStore = useUpdateOsActionsStore();

  const { mutate: signOutMutation } = useMutation<SignOutMutation>(CONNECT_SIGN_OUT);
  const { mutate: signInMutation } = useMutation<ConnectSignInMutation, ConnectSignInMutationVariables>(
    CONNECT_SIGN_IN
  );

  const accountAction = ref<ExternalSignIn | ExternalSignOut>();
  const accountActionHide = ref<boolean>(false);
  const accountActionStatus = ref<CallbackAccountStatus>('ready');
  const accountActionType = computed(() => accountAction.value?.type);

  const setAccountAction = (action: ExternalSignIn | ExternalSignOut) => {
    accountAction.value = action;
  };

  const executeSignIn = async (action: ExternalSignIn) => {
    setAccountAction(action);
    accountActionStatus.value = 'waiting';

    const { apiKey, user } = action;
    if (!apiKey || !user.email || !user.preferred_username) {
      accountActionStatus.value = 'failed';
      console.error('[executeSignIn] incorrect payload', action);
      return;
    }

    accountActionStatus.value = 'updating';

    try {
      const response = await signInMutation({
        input: {
          apiKey,
          userInfo: {
            email: user.email,
            preferred_username: user.preferred_username,
          },
        },
      });

      if (response?.data?.connectSignIn) {
        accountActionStatus.value = 'success';
        return;
      }

      accountActionStatus.value = 'failed';
      errorsStore.setError({
        heading: 'unraid-api failed to update Connect account configuration',
        message: 'Sign In mutation unsuccessful',
        level: 'error',
        ref: 'connectSignInMutation',
        type: 'account',
      });
    } catch (error) {
      logErrorMessages(error);
      accountActionStatus.value = 'failed';
      errorsStore.setError({
        heading: 'unraid-api failed to update Connect account configuration',
        message: error instanceof Error ? error.message : 'Unknown sign in error',
        level: 'error',
        ref: 'connectSignInMutation',
        type: 'account',
      });
    }
  };

  const executeSignOut = async (action: ExternalSignOut) => {
    setAccountAction(action);
    accountActionStatus.value = 'waiting';
    accountActionStatus.value = 'updating';

    try {
      const response = await signOutMutation();
      if (response?.data?.connectSignOut === false) {
        accountActionStatus.value = 'failed';
        errorsStore.setError({
          heading: 'Failed to update Connect account configuration',
          message: 'Sign Out mutation unsuccessful',
          level: 'error',
          ref: 'connectSignOutMutation',
          type: 'account',
        });
        return;
      }

      accountActionStatus.value = 'success';
    } catch (error) {
      logErrorMessages(error);
      accountActionStatus.value = 'failed';
      errorsStore.setError({
        heading: 'Failed to update Connect account configuration',
        message: error instanceof Error ? error.message : 'Unknown sign out error',
        level: 'error',
        ref: 'connectSignOutMutation',
        type: 'account',
      });
    }
  };

  const executeUpdateOs = async (action: ExternalUpdateOsAction) => {
    updateOsActionsStore.setUpdateOsAction(action);
    await updateOsActionsStore.actOnUpdateOsAction(action.type === 'downgradeOs');
  };

  const executeAction = async (action: ExternalActions) => {
    if (isKeyAction(action)) {
      await installKeyStore.install(action);
      return;
    }

    if (isAccountSignInAction(action)) {
      await executeSignIn(action);
      return;
    }

    if (isAccountSignOutAction(action)) {
      await executeSignOut(action);
      return;
    }

    if (isUpdateOsAction(action)) {
      await executeUpdateOs(action);
    }
  };

  const resetState = () => {
    accountAction.value = undefined;
    accountActionHide.value = false;
    accountActionStatus.value = 'ready';
  };

  return {
    accountAction,
    accountActionHide,
    accountActionStatus,
    accountActionType,
    executeAction,
    resetState,
  };
});
