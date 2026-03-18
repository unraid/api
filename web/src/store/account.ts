import { computed, ref, watchEffect } from 'vue';
import { defineStore } from 'pinia';
import { useMutation } from '@vue/apollo-composable';
import { logErrorMessages } from '@vue/apollo-util';

import { ACCOUNT_CALLBACK } from '~/helpers/urls';

import type { ExternalSignIn, ExternalSignOut } from '@unraid/shared-callbacks';

import { CONNECT_SIGN_IN, CONNECT_SIGN_OUT } from '~/store/account.fragment';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
import { useUnraidApiStore } from '~/store/unraidApi';

export interface ConnectSignInMutationPayload {
  apiKey: string;
  email: string;
  preferred_username: string;
}

export const useAccountStore = defineStore('account', () => {
  const callbackStore = useCallbackActionsStore();
  const errorsStore = useErrorsStore();
  const serverStore = useServerStore();
  const unraidApiStore = useUnraidApiStore();

  const serverCallbackPayload = computed(() => serverStore.serverCallbackPayload);
  const inIframe = computed(() => serverStore.inIframe);
  const sendType = computed(() => callbackStore.sendType);

  // State
  const accountAction = ref<ExternalSignIn | ExternalSignOut>();
  const accountActionHide = ref<boolean>(false);
  const accountActionStatus = ref<'failed' | 'ready' | 'success' | 'updating' | 'waiting'>('ready');

  /**
   * Handling sign in / out via graph api
   */
  const unraidApiClient = computed(() => unraidApiStore.unraidApiClient);
  const connectSignInPayload = ref<ConnectSignInMutationPayload | undefined>();
  const setConnectSignInPayload = (payload: ConnectSignInMutationPayload | undefined) => {
    connectSignInPayload.value = payload;
    if (payload) {
      accountActionStatus.value = 'waiting';
    }
  };
  const queueConnectSignOut = ref<boolean>(false);
  const setQueueConnectSignOut = (data: boolean) => {
    queueConnectSignOut.value = data;
    if (data) {
      accountActionStatus.value = 'waiting';
    }
  };

  // Initialize mutations during store setup to maintain Apollo context
  const {
    mutate: signOutMutation,
    onDone: onSignOutDone,
    onError: onSignOutError,
  } = useMutation(CONNECT_SIGN_OUT);
  const {
    mutate: signInMutation,
    onDone: onSignInDone,
    onError: onSignInError,
  } = useMutation(CONNECT_SIGN_IN);

  // Handle sign out mutation results
  onSignOutDone((res) => {
    console.debug('[connectSignOutMutation]', res);
    accountActionStatus.value = 'success';
    setQueueConnectSignOut(false); // reset
  });

  onSignOutError((error) => {
    logErrorMessages(error);
    accountActionStatus.value = 'failed';
    errorsStore.setError({
      heading: 'Failed to update Connect account configuration',
      message: error.message,
      level: 'error',
      ref: 'connectSignOutMutation',
      type: 'account',
    });
  });

  // Handle sign in mutation results
  onSignInDone((res) => {
    if (res.data?.connectSignIn) {
      accountActionStatus.value = 'success';
      setConnectSignInPayload(undefined); // reset
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
  });

  onSignInError((error) => {
    logErrorMessages(error);
    accountActionStatus.value = 'failed';
    errorsStore.setError({
      heading: 'unraid-api failed to update Connect account configuration',
      message: error.message,
      level: 'error',
      ref: 'connectSignInMutation',
      type: 'account',
    });
  });

  watchEffect(() => {
    if (unraidApiClient.value && connectSignInPayload.value) {
      // connectSignInMutation();
      setTimeout(() => {
        connectSignInMutation();
      }, 250);
    }
    if (unraidApiClient.value && queueConnectSignOut.value) {
      // connectSignOutMutation();
      setTimeout(() => {
        connectSignOutMutation();
      }, 250);
    }
  });

  // Getters
  const accountActionType = computed(() => accountAction.value?.type);

  type AccountCallbackActionType = 'myKeys' | 'signIn' | 'signOut' | 'downgradeOs' | 'updateOs';

  const sendAccountAction = (type: AccountCallbackActionType, actionType?: 'newTab' | 'replace') => {
    return callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [
        {
          server: {
            ...serverCallbackPayload.value,
          },
          type,
        },
      ],
      actionType ?? (inIframe.value ? 'newTab' : undefined),
      sendType.value
    );
  };

  const buildMyKeysActionPayload = () => [
    {
      server: {
        ...serverCallbackPayload.value,
      },
      type: 'myKeys' as const,
    },
  ];

  const generateMyKeysUrl = () =>
    callbackStore.generateUrl(
      ACCOUNT_CALLBACK.toString(),
      buildMyKeysActionPayload(),
      sendType.value,
      undefined
    );

  // Actions
  const downgradeOs = async (autoRedirectReplace?: boolean) => {
    return sendAccountAction(
      'downgradeOs',
      inIframe.value ? 'newTab' : autoRedirectReplace ? 'replace' : undefined
    );
  };

  const myKeys = () => sendAccountAction('myKeys');
  const recover = () => myKeys();
  const replace = () => myKeys();
  const replaceTpm = () => myKeys();
  const signIn = () => {
    sendAccountAction('signIn');
  };
  const signOut = () => {
    sendAccountAction('signOut');
  };
  const trialExtend = () => myKeys();

  const updateOs = async (autoRedirectReplace?: boolean) => {
    return sendAccountAction(
      'updateOs',
      inIframe.value ? 'newTab' : autoRedirectReplace ? 'replace' : undefined
    );
  };

  const connectSignInMutation = () => {
    if (
      !connectSignInPayload.value ||
      (connectSignInPayload.value &&
        (!connectSignInPayload.value.apiKey ||
          !connectSignInPayload.value.email ||
          !connectSignInPayload.value.preferred_username))
    ) {
      accountActionStatus.value = 'failed';
      return console.error('[connectSignInMutation] incorrect payload', connectSignInPayload.value);
    }

    accountActionStatus.value = 'updating';

    return signInMutation({
      input: {
        apiKey: connectSignInPayload.value.apiKey,
        userInfo: {
          email: connectSignInPayload.value.email,
          preferred_username: connectSignInPayload.value.preferred_username,
        },
      },
    });
  };

  const connectSignOutMutation = () => {
    accountActionStatus.value = 'updating';
    return signOutMutation();
  };

  const setAccountAction = (action: ExternalSignIn | ExternalSignOut) => {
    console.debug('[setAccountAction]', { action });
    accountAction.value = action;
  };

  return {
    // State
    accountAction,
    accountActionHide,
    accountActionStatus,
    // Getters
    accountActionType,
    // Actions
    downgradeOs,
    myKeys,
    recover,
    replace,
    replaceTpm,
    signIn,
    signOut,
    trialExtend,
    updateOs,
    generateMyKeysUrl,
    openInNewTab: computed(() => inIframe.value),
    setAccountAction,
    setConnectSignInPayload,
    setQueueConnectSignOut,
  };
});
