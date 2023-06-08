import { defineStore, createPinia, setActivePinia } from 'pinia';
import { useCallbackStore } from './callback';
import { useServerStore } from './server';
import { WebguiUpdate } from '~/composables/services/webgui';
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
  const updating = ref(false);
  const updateSuccess = ref<boolean|undefined>(undefined);
  // Actions
  const recover = () => {
    console.debug('[recover]');
    callbackStore.send('https://account.unraid.net', {
      ...serverStore.serverAccountPayload,
      type: 'recover',
    });
  };
  const replace = () => {
    console.debug('[replace]');
    callbackStore.send('https://account.unraid.net', {
      ...serverStore.serverAccountPayload,
      type: 'replace',
    });
  };
  const signIn = () => {
    console.debug('[signIn]');
    callbackStore.send('https://account.unraid.net', {
      ...serverStore.serverAccountPayload,
      type: 'signIn',
    });
  };
  const signOut = () => {
    console.debug('[signOut]');
    callbackStore.send('https://account.unraid.net', {
      ...serverStore.serverAccountPayload,
      type: 'signOut',
    });
  };
  /**
   * @description Update myservers.cfg for both Sign In & Sign Out
   * @note unraid-api requires apikey & token realted keys to be lowercase
   */
  const updatePluginConfig = async (action: CallbackAction) => {
    console.debug('[updatePluginConfig]', action);
    updating.value = true;
    const userPayload = {
      ...(action.user
        ? {
            accesstoken: action.user.signInUserSession.accessToken.jwtToken,
            apikey: serverStore.apiKey,
            // avatar: action.user?.attributes.avatar,
            email: action.user?.attributes.email,
            idtoken: action.user.signInUserSession.idToken.jwtToken,
            refreshtoken: action.user.signInUserSession.refreshToken.token,
            regWizTime: `${Date.now()}_${serverStore.guid}`, // set when signing in the first time and never unset for the sake of displaying Sign In/Up in the UPC without needing to validate guid every time
            username: action.user?.attributes.preferred_username,
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
        .post();
      console.debug('[updatePluginConfig] WebguiUpdate response', response);
      updateSuccess.value = true;
    } catch (error) {
      console.debug('[updatePluginConfig] WebguiUpdate error', error);
      updateSuccess.value = false;
    } finally {
      updating.value = false;
    }
  };

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
