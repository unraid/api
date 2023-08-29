import { defineStore, createPinia, setActivePinia } from 'pinia';

import { useCallbackStore } from '~/store/callbackActions';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
import { WebguiUpdate } from '~/composables/services/webgui';
import { ACCOUNT_CALLBACK } from '~/helpers/urls';
import type { ExternalSignIn, ExternalSignOut } from '~/store/callback';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useAccountStore = defineStore('account', () => {
  const callbackStore = useCallbackStore();
  const errorsStore = useErrorsStore();
  const serverStore = useServerStore();

  // State
  const accountAction = ref<ExternalSignIn|ExternalSignOut>();
  const accountActionHide = ref<boolean>(false);
  const accountActionStatus = ref<'failed' | 'ready' | 'success' | 'updating'>('ready');

  const username = ref<string>('');

  // Getters
  const accountActionType = computed(() => accountAction.value?.type);

  // Actions
  const recover = () => {
    callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverAccountPayload,
        },
        type: 'recover',
      }],
      serverStore.inIframe,
    );
  };
  const replace = () => {
    callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverAccountPayload,
        },
        type: 'replace',
      }],
      serverStore.inIframe,
    );
  };
  const signIn = () => {
    callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverAccountPayload,
        },
        type: 'signIn',
      }],
      serverStore.inIframe,
    );
  };
  const signOut = () => {
    callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverAccountPayload,
        },
        type: 'signOut',
      }],
      serverStore.inIframe,
    );
  };
  const trialExtend = () => {
    callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverAccountPayload,
        },
        type: 'trialExtend',
      }],
      serverStore.inIframe,
    );
  };
  const trialStart = () => {
    callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverAccountPayload,
        },
        type: 'trialStart',
      }],
      serverStore.inIframe,
    );
  };
  /**
   * @description Update myservers.cfg for both Sign In & Sign Out
   * @note unraid-api requires apikey & token realted keys to be lowercase
   */
  const updatePluginConfig = async (action: ExternalSignIn | ExternalSignOut) => {
    // save any existing username before updating
    if (serverStore.username) { username.value = serverStore.username; }

    accountAction.value = action;
    accountActionStatus.value = 'updating';

    if (!serverStore.registered && !accountAction.value.user) {
      accountActionHide.value = true;
      accountActionStatus.value = 'success';
      return;
    }

    try {
      const userPayload = {
        ...(accountAction.value.user
          ? {
              apikey: accountAction.value.apiKey,
              // avatar: '',
              email: accountAction.value.user?.email,
              regWizTime: `${Date.now()}_${serverStore.guid}`, // set when signing in the first time and never unset for the sake of displaying Sign In/Up in the UPC without needing to validate guid every time
              username: accountAction.value.user?.preferred_username,
            }
          : {
              accesstoken: '',
              apikey: '',
              avatar: '',
              email: '',
              idtoken: '',
              refreshtoken: '',
              username: '',
            }),
      };
      const response = await WebguiUpdate
        .formUrl({
          csrf_token: serverStore.csrf,
          '#file': 'dynamix.my.servers/myservers.cfg',
          '#section': 'remote',
          ...userPayload,
        })
        .post()
        .res((res) => {
          accountActionStatus.value = 'success';
        })
        .catch((err) => {
          accountActionStatus.value = 'failed';
          errorsStore.setError({
            heading: 'Failed to update Connect account configuration',
            message: err.message,
            level: 'error',
            ref: 'updatePluginConfig',
            type: 'account',
          });
        });
      return response;
    } catch (err) {
      accountActionStatus.value = 'failed';
      errorsStore.setError({
        heading: 'Failed to update Connect account configuration',
        message: err.message,
        level: 'error',
        ref: 'updatePluginConfig',
        type: 'account',
      });
    }
  };

  return {
    // State
    accountAction,
    accountActionHide,
    accountActionStatus,
    // Getters
    accountActionType,
    // Actions
    recover,
    replace,
    signIn,
    signOut,
    trialExtend,
    trialStart,
    updatePluginConfig,
  };
});
