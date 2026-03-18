import { computed, ref, watchEffect } from 'vue';
import { defineStore } from 'pinia';
import { useMutation } from '@vue/apollo-composable';
import { logErrorMessages } from '@vue/apollo-util';

import { ACCOUNT_CALLBACK } from '~/helpers/urls';

import type { ExternalSignIn, ExternalSignOut, ServerData } from '@unraid/shared-callbacks';

import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
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
  const activationCodeStore = useActivationCodeDataStore();
  const serverStore = useServerStore();
  const unraidApiStore = useUnraidApiStore();

  const activationCode = computed(() => activationCodeStore.activationCode);
  const serverAccountPayload = computed(() => serverStore.serverAccountPayload);
  const serverReplacePayload = computed(() => serverStore.serverReplacePayload);
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

  type AccountCallbackAction =
    | 'downgradeOs'
    | 'manage'
    | 'myKeys'
    | 'recover'
    | 'replace'
    | 'signIn'
    | 'signOut'
    | 'trialExtend'
    | 'trialStart'
    | 'updateOs';

  const buildServerPayload = (payload: ServerData) => {
    const basePayload = {
      ...payload,
    };

    const activationCodeValue = activationCode.value;
    if (activationCodeValue) {
      const { code, partner, system } = activationCodeValue;
      const activationCodeData = {
        ...(code ? { code } : {}),
        ...(partner ? { partner } : {}),
        ...(system ? { system } : {}),
      };

      return {
        ...basePayload,
        activationCodeData: Object.keys(activationCodeData).length ? activationCodeData : null,
      };
    }

    return basePayload;
  };

  const sendAccountAction = (
    type: AccountCallbackAction,
    options?: {
      redirect?: 'newTab' | 'replace';
      serverPayload?: ServerData;
    }
  ) => {
    const redirect = options?.redirect ?? (inIframe.value ? 'newTab' : undefined);
    const payload = buildServerPayload(options?.serverPayload ?? serverAccountPayload.value);

    return callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [
        {
          server: payload,
          type,
        },
      ],
      redirect,
      sendType.value
    );
  };

  // Actions
  const downgradeOs = async (autoRedirectReplace?: boolean) => {
    await sendAccountAction('downgradeOs', {
      redirect: inIframe.value ? 'newTab' : autoRedirectReplace ? 'replace' : undefined,
    });
  };

  const manage = () => {
    sendAccountAction('manage');
  };
  const myKeys = () => {
    sendAccountAction('myKeys');
  };
  const recover = () => {
    sendAccountAction('recover');
  };
  const replace = () => {
    sendAccountAction('replace');
  };
  const replaceTpm = () => {
    sendAccountAction('replace', { serverPayload: serverReplacePayload.value });
  };
  const signIn = () => {
    sendAccountAction('signIn');
  };
  const signOut = () => {
    sendAccountAction('signOut');
  };
  const trialExtend = () => {
    sendAccountAction('trialExtend');
  };
  const trialStart = () => {
    sendAccountAction('trialStart');
  };

  const updateOs = async (autoRedirectReplace?: boolean) => {
    await sendAccountAction('updateOs', {
      redirect: inIframe.value ? 'newTab' : autoRedirectReplace ? 'replace' : undefined,
    });
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
    manage,
    myKeys,
    recover,
    replace,
    replaceTpm,
    signIn,
    signOut,
    trialExtend,
    trialStart,
    updateOs,
    setAccountAction,
    setConnectSignInPayload,
    setQueueConnectSignOut,
  };
});
