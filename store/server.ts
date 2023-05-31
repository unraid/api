import { defineStore, createPinia, setActivePinia } from "pinia";
import { ArrowRightOnRectangleIcon, GlobeAltIcon, KeyIcon } from '@heroicons/vue/24/solid';
import type {
  Server,
  ServerStateData,
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
  const description = ref<string>();
  const deviceCount = ref<number>();
  const expireTime = ref<number>();
  const flashProduct = ref<string>();
  const flashVendor = ref<string>();
  const guid = ref<string>();
  const keyfile = ref<string>();
  const lanIp = ref<string>();
  const license = ref<string>();
  const locale = ref<string>();
  const name = ref<string>();
  const pluginInstalled = ref<boolean>();
  const registered = ref<boolean>();
  const regGen = ref<number>();
  const regGuid = ref<string>();
  const site = ref<string>();
  const state = ref<string>(); // @todo implement ServerState ENUM
  const uptime = ref<number>();
  const wanFQDN = ref<string>();

  /**
   * Getters
   */
  const server = computed<Server>(():Server => {
    return {
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
      wanFQDN: wanFQDN.value,
    }
  });

  const stateDataDefault: ServerStateData = {
    actions: [
      {
        click: () => { console.debug('signIn') },
        icon: GlobeAltIcon,
        name: 'signIn',
        text: 'Sign In with Unraid.net Account',
      },
      {
        click: () => { console.debug('purchase') },
        icon: KeyIcon,
        name: 'purchase',
        text: 'Purchase Key',
      },
      // {
      //   click: () => { console.debug('signOut') },
      //   icon: ArrowRightOnRectangleIcon,
      //   name: 'signOut',
      //   text: 'signOut',
      // },
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
        };
      case 'EGUID1':
        return {
          ...stateDataDefault,
        };
      case 'ENOKEYFILE2':
        return {
          ...stateDataDefault,
        };
      case 'ETRIAL':
        return {
          ...stateDataDefault,
        };
      case 'ENOKEYFILE1':
        return {
          ...stateDataDefault,
        };
      case 'ENOFLASH':
        return {
          ...stateDataDefault,
        };
      case 'ENOFLASH1':
        return {
          ...stateDataDefault,
        };
      case 'ENOFLASH2':
        return {
          ...stateDataDefault,
        };
      case 'ENOFLASH3':
        return {
          ...stateDataDefault,
        };
      case 'ENOFLASH4':
        return {
          ...stateDataDefault,
        };
      case 'ENOFLASH5':
        return {
          ...stateDataDefault,
        };
      case 'ENOFLASH6':
        return {
          ...stateDataDefault,
        };
      case 'ENOFLASH7':
        return {
          ...stateDataDefault,
        };
      case 'EBLACKLISTED':
        return {
          ...stateDataDefault,
        };
      case 'EBLACKLISTED1':
        return {
          ...stateDataDefault,
        };
      case 'EBLACKLISTED2':
        return {
          ...stateDataDefault,
        };
      case 'ENOCONN':
        return {
          ...stateDataDefault,
        };
      default:
        return {
          ...stateDataDefault,
        };
    }
  });

  /**
   * Actions
   */
  const setServer = (data: Server) => {
    console.debug('[setServer]', data);
    description.value = data?.description;
    deviceCount.value = data?.deviceCount;
    expireTime.value = data?.expireTime;
    flashProduct.value = data?.flashProduct;
    flashVendor.value = data?.flashVendor;
    guid.value = data?.guid;
    keyfile.value = data?.keyfile;
    lanIp.value = data?.lanIp;
    license.value = data?.license;
    locale.value = data?.locale;
    name.value = data?.name;
    pluginInstalled.value = data?.pluginInstalled;
    registered.value = data?.registered;
    regGen.value = data?.regGen;
    regGuid.value = data?.regGuid;
    site.value = data?.site;
    state.value = data?.state;
    uptime.value = data?.uptime;
    wanFQDN.value = data?.wanFQDN;
  };

  return {
    // state
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
    // getters
    server,
    stateData,
    // actions
    setServer,
  };
});
