import { defineStore, createPinia, setActivePinia } from 'pinia';
import { useCallbackStore } from './callbackActions';
import { useServerStore } from './server';
import { WebguiUpdate } from '~/composables/services/webgui';
import { ACCOUNT_CALLBACK } from '~/helpers/urls';
import type { CallbackAction } from '~/types/callback';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useAccountStore = defineStore('account', () => {
  const callbackStore = useCallbackStore();
  const serverStore = useServerStore();

  // State
  const updating = ref<boolean | undefined>(undefined);
  const updateSuccess = ref<boolean | undefined>(undefined);

  // Actions
  const recover = () => {
    console.debug('[accountStore.recover]');
    callbackStore.send('https://localhost:8008/connect', [{
      server: {
        ...serverStore.serverAccountPayload,
      },
      type: 'recover',
    }]);
  };
  const replace = () => {
    console.debug('[accountStore.replace]');
    callbackStore.send('https://localhost:8008/connect', [{
      server: {
        ...serverStore.serverAccountPayload,
      },
      type: 'replace',
    }]);
  };
  const signIn = () => {
    console.debug('[accountStore.signIn]');
    callbackStore.send('https://localhost:8008/connect', [{
      server: {
        ...serverStore.serverAccountPayload,
      },
      type: 'signIn',
    }]);
  };
  const signOut = () => {
    console.debug('[accountStore.accountStore.signOut]');
    callbackStore.send('https://localhost:8008/connect', [{
      server: {
        ...serverStore.serverAccountPayload,
      },
      type: 'signOut',
    }]);
  };
  /**
   * @description Update myservers.cfg for both Sign In & Sign Out
   * @note unraid-api requires apikey & token realted keys to be lowercase
   */
  const updatePluginConfig = async (action: CallbackAction) => {
    console.debug('[accountStore.updatePluginConfig]', action);
    updating.value = true;
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
          updateSuccess.value = true;
        })
        .catch(err => {
          console.debug('[accountStore.updatePluginConfig] WebguiUpdate err', err);
          updateSuccess.value = false;
        });
      return response;
    } finally {
      updating.value = false;
    }
  };

  watch(updating, (newV, oldV) => {
    console.debug('[updating.watch]', newV, oldV);
  });

  return {
    // State
    updating,
    updateSuccess,
    // Actions
    recover,
    replace,
    signIn,
    signOut,
    updatePluginConfig,
  };
});
