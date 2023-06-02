import { defineStore, createPinia, setActivePinia } from "pinia";
import { ArrowRightOnRectangleIcon, GlobeAltIcon, KeyIcon } from '@heroicons/vue/24/solid';
import type {
  Server,
  ServerState,
  ServerStateData,
  ServerStateDataAction,
} from '~/types/server';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useServerStore = defineStore('server', () => {
  /**
   * State
   */
  const avatar = ref<string>(''); // @todo potentially move to a user store
  const apiKey = ref<string>(''); // @todo potentially move to a user store
  const description = ref<string>('');
  const deviceCount = ref<number>(0);
  const expireTime = ref<number>(0);
  const flashProduct = ref<string>('');
  const flashVendor = ref<string>('');
  const guid = ref<string>('');
  const keyfile = ref<string>('');
  const lanIp = ref<string>('');
  const license = ref<string>('');
  const locale = ref<string>('');
  const name = ref<string>('');
  const pluginInstalled = ref<boolean>(false);
  const registered = ref<boolean>();
  const regGen = ref<number>(0);
  const regGuid = ref<string>('');
  const site = ref<string>('');
  const state = ref<string>(''); // @todo implement ServerState ENUM
  const uptime = ref<number>(0);
  const username = ref<string>(''); // @todo potentially move to a user store
  const wanFQDN = ref<string>('');

  /**
   * Getters
   */
  const isRemoteAccess = computed(() => wanFQDN.value || (site.value && site.value.includes('www.') && site.value.includes('unraid.net')));
  /**
   * @todo configure
   */
  const pluginOutdated = computed(():boolean => {
    return false;
  });

  const server = computed<Server>(():Server => {
    return {
      apiKey: apiKey.value,
      avatar: avatar.value,
      description: description.value,
      deviceCount: deviceCount.value,
      expireTime: expireTime.value,
      flashProduct: flashProduct.value,
      flashVendor: flashVendor.value,
      guid: guid.value,
      keyfile: keyfile.value,
      lanIp: lanIp.value,
      license: license.value,
      locale: locale.value,
      name: name.value,
      pluginInstalled: pluginInstalled.value,
      registered: registered.value,
      regGen: regGen.value,
      regGuid: regGuid.value,
      site: site.value,
      state: state.value,
      uptime: uptime.value,
      username: username.value,
      wanFQDN: wanFQDN.value,
    }
  });

  const signInAction: ServerStateDataAction = {
    click: () => { console.debug('signIn') },
    external: true,
    icon: GlobeAltIcon,
    name: 'signIn',
    text: 'Sign In with Unraid.net Account',
  };
  const signOutAction: ServerStateDataAction = {
    click: () => { console.debug('signOut') },
    external: true,
    icon: ArrowRightOnRectangleIcon,
    name: 'signOut',
    text: 'Sign Out of Unraid.net',
  };
  const stateDataDefault: ServerStateData = {
    actions: [
      // sign in
      ...(registered.value ? [] : [signInAction]),
      {
        click: () => { console.debug('purchase') },
        external: true,
        icon: KeyIcon,
        name: 'purchase',
        text: 'Purchase Key',
      },
      // sign out,
      ...(registered.value ? [signOutAction] : []),
    ],
    humanReadable: 'Trial',
    heading: 'Thank you for choosing Unraid OS!',
    message: '[Temp] Your Trial Key includes all the features of a Pro Key',
  };
  const stateData = computed(():ServerStateData => {
    switch (state.value) {
      case 'TRIAL':
        return {
          ...stateDataDefault,
        };
      case 'EEXPIRED':
        return {
          ...stateDataDefault,
        };
      case 'BASIC':
        return {
          ...stateDataDefault,
        };
      case 'PLUS':
        return {
          ...stateDataDefault,
        };
      case 'PRO':
        return {
          ...stateDataDefault,
        };
      case 'EGUID':
        return {
          ...stateDataDefault,
          error: {
            heading: `${state.value} temp heading`,
            message: `${state.value} temp message – this is an error message`,
            reAuthFix: false,
          },
        };
      case 'EGUID1':
        return {
          ...stateDataDefault,
          error: {
            heading: `${state.value} temp heading`,
            message: `${state.value} temp message – this is an error message`,
            reAuthFix: false,
          },
        };
      case 'ENOKEYFILE2':
        return {
          ...stateDataDefault,
          error: {
            heading: `${state.value} temp heading`,
            message: `${state.value} temp message – this is an error message`,
            reAuthFix: false,
          },
        };
      case 'ETRIAL':
        return {
          ...stateDataDefault,
          error: {
            heading: `${state.value} temp heading`,
            message: `${state.value} temp message – this is an error message`,
            reAuthFix: false,
          },
        };
      case 'ENOKEYFILE1':
        return {
          ...stateDataDefault,
          error: {
            heading: `${state.value} temp heading`,
            message: `${state.value} temp message – this is an error message`,
            reAuthFix: false,
          },
        };
      case 'ENOFLASH':
      case 'ENOFLASH1':
      case 'ENOFLASH2':
      case 'ENOFLASH3':
      case 'ENOFLASH4':
      case 'ENOFLASH5':
      case 'ENOFLASH6':
      case 'ENOFLASH7':
        return {
          ...stateDataDefault,
          error: {
            heading: `${state.value} temp heading`,
            message: `${state.value} temp message – this is an error message`,
            reAuthFix: false,
          },
        };
      case 'EBLACKLISTED':
        return {
          ...stateDataDefault,
          error: {
            heading: `${state.value} temp heading`,
            message: `${state.value} temp message – this is an error message`,
            reAuthFix: false,
          },
        };
      case 'EBLACKLISTED1':
        return {
          ...stateDataDefault,
          error: {
            heading: `${state.value} temp heading`,
            message: `${state.value} temp message – this is an error message`,
            reAuthFix: false,
          },
        };
      case 'EBLACKLISTED2':
        return {
          ...stateDataDefault,
          error: {
            heading: `${state.value} temp heading`,
            message: `${state.value} temp message – this is an error message`,
            reAuthFix: false,
          },
        };
      case 'ENOCONN':
        return {
          ...stateDataDefault,
          error: {
            heading: `${state.value} temp heading`,
            message: `${state.value} temp message – this is an error message`,
            reAuthFix: false,
          },
        };
      default:
        return {
          ...stateDataDefault,
        };
    }
  });
  const authActionsNames = ['signIn', 'signOut'];
  // Extract sign in / out from actions so we can display seperately as needed
  const authActions = computed((): ServerStateDataAction | undefined => {
    if (!stateData.value.actions) return;
    return stateData.value.actions.find(action => authActionsNames.includes(action.name));
  });
  // Remove sign in / out from actions so we can display them separately
  const keyActions = computed((): ServerStateDataAction[] | undefined => {
    if (!stateData.value.actions) return;
    return stateData.value.actions.filter(action => !authActionsNames.includes(action.name));
  });

  /**
   * Actions
   */
  const setServer = (data: Server) => {
    console.debug('[setServer]', data);
    if (data?.apiKey) apiKey.value = data.apiKey;
    if (data?.avatar) avatar.value = data.avatar;
    if (data?.description) description.value = data.description;
    if (data?.deviceCount) deviceCount.value = data.deviceCount;
    if (data?.expireTime) expireTime.value = data.expireTime;
    if (data?.flashProduct) flashProduct.value = data.flashProduct;
    if (data?.flashVendor) flashVendor.value = data.flashVendor;
    if (data?.guid) guid.value = data.guid;
    if (data?.keyfile) keyfile.value = data.keyfile;
    if (data?.lanIp) lanIp.value = data.lanIp;
    if (data?.license) license.value = data.license;
    if (data?.locale) locale.value = data.locale;
    if (data?.name) name.value = data.name;
    if (data?.pluginInstalled) pluginInstalled.value = data.pluginInstalled;
    if (data?.registered) registered.value = data.registered;
    if (data?.regGen) regGen.value = data.regGen;
    if (data?.regGuid) regGuid.value = data.regGuid;
    if (data?.site) site.value = data.site;
    if (data?.state) state.value = data.state;
    if (data?.uptime) uptime.value = data.uptime;
    if (data?.username) username.value = data.username;
    if (data?.wanFQDN) wanFQDN.value = data.wanFQDN;
  };

  return {
    // state
    apiKey,
    avatar,
    description,
    deviceCount,
    expireTime,
    guid,
    locale,
    lanIp,
    name,
    pluginInstalled,
    registered,
    regGen,
    regGuid,
    site,
    state,
    uptime,
    username,
    // getters
    authActions,
    isRemoteAccess,
    keyActions,
    pluginOutdated,
    server,
    stateData,
    // actions
    setServer,
  };
});
