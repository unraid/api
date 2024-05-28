import { useMutation } from '@vue/apollo-composable';
import { logErrorMessages } from '@vue/apollo-util';
import { defineStore, createPinia, setActivePinia } from 'pinia';

import { CONNECT_SIGN_IN, CONNECT_SIGN_OUT } from './account.fragment';
import { useCallbackStore } from '~/store/callbackActions';
import { useErrorsStore } from '~/store/errors';
import { useReplaceRenewStore } from '~/store/replaceRenew';
import { useServerStore } from '~/store/server';
import { useUnraidApiStore } from '~/store/unraidApi';
import { ACCOUNT_CALLBACK } from '~/helpers/urls';
import type { ExternalSignIn, ExternalSignOut } from '~/store/callback';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export interface ConnectSignInMutationPayload {
  apiKey: string;
  email: string;
  preferred_username: string;
}

export const useAccountStore = defineStore('account', () => {
  const callbackStore = useCallbackStore();
  const errorsStore = useErrorsStore();
  const replaceRenewStore = useReplaceRenewStore();
  const serverStore = useServerStore();
  const unraidApiStore = useUnraidApiStore();

  const serverAccountPayload = computed(() => serverStore.serverAccountPayload);
  const inIframe = computed(() => serverStore.inIframe);

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

  // Actions
  const downgradeOs = async (autoRedirectReplace?: boolean) => {
    await callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverAccountPayload.value,
        },
        type: 'downgradeOs',
      }],
      inIframe.value ? 'newTab' : (autoRedirectReplace ? 'replace' : undefined),
    );
  };

  const manage = () => {
    callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverAccountPayload.value,
        },
        type: 'manage',
      }],
      inIframe.value ? 'newTab' : undefined,
    );
  };
  const myKeys = async () => {
    /**
     * Purge the validation response so we can start fresh after the user has linked their key
     */
    await replaceRenewStore.purgeValidationResponse();

    callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverAccountPayload.value,
        },
        type: 'myKeys',
      }],
      inIframe.value ? 'newTab' : undefined,
    );
  };
  const linkKey = async () => {
    /**
     * Purge the validation response so we can start fresh after the user has linked their key
     */
    await replaceRenewStore.purgeValidationResponse();

    callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverAccountPayload.value,
        },
        type: 'linkKey',
      }],
      inIframe.value ? 'newTab' : undefined,
    );
  };
  const recover = () => {
    callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverAccountPayload.value,
        },
        type: 'recover',
      }],
      inIframe.value ? 'newTab' : undefined,
    );
  };
  const replace = () => {
    callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverAccountPayload.value,
        },
        type: 'replace',
      }],
      inIframe.value ? 'newTab' : undefined,
    );
  };
  const signIn = () => {
    callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverAccountPayload.value,
        },
        type: 'signIn',
      }],
      inIframe.value ? 'newTab' : undefined,
    );
  };
  const signOut = () => {
    callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverAccountPayload.value,
        },
        type: 'signOut',
      }],
      inIframe.value ? 'newTab' : undefined,
    );
  };
  const trialExtend = () => {
    callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverAccountPayload.value,
        },
        type: 'trialExtend',
      }],
      inIframe.value ? 'newTab' : undefined,
    );
  };
  const trialStart = () => {
    callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverAccountPayload.value,
        },
        type: 'trialStart',
      }],
      inIframe.value ? 'newTab' : undefined,
    );
  };

  const updateOs = async (autoRedirectReplace?: boolean) => {
    await callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverAccountPayload.value,
        },
        type: 'updateOs',
      }],
      inIframe.value ? 'newTab' : (autoRedirectReplace ? 'replace' : undefined),
    );
  };

  const connectSignInMutation = async () => {
    if (!connectSignInPayload.value ||
      (connectSignInPayload.value && (!connectSignInPayload.value.apiKey || !connectSignInPayload.value.email || !connectSignInPayload.value.preferred_username))
    ) {
      accountActionStatus.value = 'failed';
      return console.error('[connectSignInMutation] incorrect payload', connectSignInPayload.value);
    }

    accountActionStatus.value = 'updating';
    const { mutate: signInMutation, onDone, onError } = await useMutation(CONNECT_SIGN_IN, {
      variables: {
        input: {
          apiKey: connectSignInPayload.value.apiKey,
          userInfo: {
            email: connectSignInPayload.value.email,
            preferred_username: connectSignInPayload.value.preferred_username,
          }
        }
      }
    });

    signInMutation();

    onDone((res) => {
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

    onError((error) => {
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
  };

  const connectSignOutMutation = async () => {
    accountActionStatus.value = 'updating';
    // @todo is this still needed here with the change to a mutation?
    // if (!serverStore.registered && accountAction.value && !accountAction.value?.user) {
    //   accountActionHide.value = true;
    //   accountActionStatus.value = 'success';
    //   return;
    // }

    const { mutate: signOutMutation, onDone, onError } = await useMutation(CONNECT_SIGN_OUT);

    signOutMutation();

    onDone((res) => {
      console.debug('[connectSignOutMutation]', res);
      accountActionStatus.value = 'success';
      setQueueConnectSignOut(false); // reset
    });

    onError((error) => {
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
  };

  const setAccountAction = (action: ExternalSignIn|ExternalSignOut) => {
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
    linkKey,
    recover,
    replace,
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
