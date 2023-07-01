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
  const accountActionHide = ref<boolean>(false);
  const accountActionStatus = ref<'failed' | 'ready' | 'success' | 'updating'>('ready');

  const username = ref<string>('');

  // Getters
  const accountActionType = computed(() => accountAction.value?.type);
  const accountActionStatusCopy = computed((): { text: string; } => {
    switch (accountActionStatus.value) {
      case 'ready':
        return {
          text: 'Ready to update Connect account configuration',
        };
      case 'updating':
        return {
          text: accountAction.value?.type === 'signIn'
            ? `Signing in ${accountAction.value.user?.preferred_username}...`
            : `Signing out ${username.value}...`,
        };
      case 'success':
        return {
          text: accountAction.value?.type === 'signIn'
            ? `${accountAction.value.user?.preferred_username} Signed In Successfully`
            : `${username.value} Signed Out Successfully`,
        };
      case 'failed':
        return {
          text:  accountAction.value?.type === 'signIn'
            ? 'Sign In Failed'
            : 'Sign Out Failed',
        };
    }
  });

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
    // save any existing username before updating
    if (serverStore.username) username.value = serverStore.username;

    accountAction.value = action;
    accountActionStatus.value = 'updating';

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

    if (!serverStore.registered && !accountAction.value.user) {
      console.debug('[accountStore.updatePluginConfig] Not registered skipping sign out');
      accountActionHide.value = true;
      accountActionStatus.value = 'success';
      return;
    }

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

  return {
    // State
    accountAction,
    accountActionHide,
    accountActionStatus,
    // Getters
    accountActionStatusCopy,
    accountActionType,
    // Actions
    recover,
    replace,
    signIn,
    signOut,
    troubleshoot,
    updatePluginConfig,
  };
});
