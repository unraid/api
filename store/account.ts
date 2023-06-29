import { defineStore, createPinia, setActivePinia } from 'pinia';
import { useCallbackStore } from './callbackActions';
import { useServerStore } from './server';
import { WebguiUpdate } from '~/composables/services/webgui';
import { ACCOUNT } from '~/helpers/urls';
import type { ExternalSignIn, ExternalSignOut } from '~/store/callback';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useAccountStore = defineStore('account', () => {
  const callbackStore = useCallbackStore();
  const serverStore = useServerStore();

  // State
  const accountAction = ref<ExternalSignIn|ExternalSignOut>();
  const accountActionStatus = ref<'failed' | 'ready' | 'success' | 'updating'>('ready');

  // Actions
  const recover = () => {
    console.debug('[accountStore.recover]');
    callbackStore.send(`${ACCOUNT}/connect`, [{
      server: {
        ...serverStore.serverAccountPayload,
      },
      type: 'recover',
    }]);
  };
  const replace = () => {
    console.debug('[accountStore.replace]');
    callbackStore.send(`${ACCOUNT}/connect`, [{
      server: {
        ...serverStore.serverAccountPayload,
      },
      type: 'replace',
    }]);
  };
  const signIn = () => {
    console.debug('[accountStore.signIn]');
    callbackStore.send(`${ACCOUNT}/connect`, [{
      server: {
        ...serverStore.serverAccountPayload,
      },
      type: 'signIn',
    }]);
  };
  const signOut = () => {
    console.debug('[accountStore.accountStore.signOut]');
    callbackStore.send(`${ACCOUNT}/connect`, [{
      server: {
        ...serverStore.serverAccountPayload,
      },
      type: 'signOut',
    }]);
  };
  const troubleshoot = () => {
    console.debug('[accountStore.accountStore.troubleshoot]');
    callbackStore.send(`${ACCOUNT}/connect`, [{
      server: {
        ...serverStore.serverAccountPayload,
      },
      type: 'troubleshoot',
    }]);
  };
  /**
   * @description Update myservers.cfg for both Sign In & Sign Out
   * @note unraid-api requires apikey & token realted keys to be lowercase
   */
  const updatePluginConfig = async (action: ExternalSignIn | ExternalSignOut) => {
    console.debug('[accountStore.updatePluginConfig]', action);
    accountAction.value = action;
    accountActionStatus.value = 'updating';

    const userPayload = {
      ...(action.user
        ? {
            apikey: action.apiKey,
            // avatar: '',
            email: action.user?.email,
            regWizTime: `${Date.now()}_${serverStore.guid}`, // set when signing in the first time and never unset for the sake of displaying Sign In/Up in the UPC without needing to validate guid every time
            username: action.user?.preferred_username,
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

    try {
      const response = await WebguiUpdate
        .formUrl({
          csrf_token: serverStore.csrf,
          '#file': 'dynamix.my.servers/myservers.cfg',
          '#section': 'remote',
          ...userPayload,
        })
        .post()
        .res(res => {
          console.debug('[accountStore.updatePluginConfig] WebguiUpdate res', res);
          accountActionStatus.value = 'success';
        })
        .catch(err => {
          console.debug('[accountStore.updatePluginConfig] WebguiUpdate err', err);
          accountActionStatus.value = 'failed';
        });
      return response;
    } catch(err) {
      console.debug('[accountStore.updatePluginConfig] WebguiUpdate catch err', err);
      accountActionStatus.value = 'failed';
    }
  };

  const accountActionStatusCopy = computed((): { text: string; } => {
    switch (accountActionStatus.value) {
      case 'ready':
        return {
          text: 'Ready to update Connect account configuration',
        };
      case 'updating':
        return {
          text: accountAction.value?.type === 'signIn'
            ? 'Signing in...'
            : 'Signing out...',
        };
      case 'success':
        return {
          text: accountAction.value?.type === 'signIn'
            ? 'Signed in successfully'
            : 'Signed out successfully',
        };
      case 'failed':
        return {
          text:  accountAction.value?.type === 'signIn'
            ? 'Sign in failed'
            : 'Sign out failed',
        };
    }
  });

  watch(accountActionStatus, (newV, oldV) => {
    console.debug('[accountActionStatus.watch]', newV, oldV);
  });

  return {
    // State
    accountAction,
    accountActionStatus,
    // Getters
    accountActionStatusCopy,
    // Actions
    recover,
    replace,
    signIn,
    signOut,
    troubleshoot,
    updatePluginConfig,
  };
});
