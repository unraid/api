import { defineStore, createPinia, setActivePinia } from "pinia";
import type { Server, ServerState, ServerStateData } from '~/types/server';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useServerStore = defineStore('server', () => {
  /**
   * State
   */
  const description = ref<string | undefined>();
  const deviceCount = ref<number | undefined>();
  const guid = ref<string | undefined>();
  const locale = ref<string | undefined>();
  const name = ref<string | undefined>();
  const site = ref<string | undefined>();
  const state = ref<string | undefined>(); // @todo implement ServerState ENUM
  const uptime = ref<number | undefined>();
  const expireTime = ref<number | undefined>();

  /**
   * Getters
   */
  const server = computed<Server>(():Server => {
    return {
      description: description.value,
      deviceCount: deviceCount.value,
      guid: guid.value,
      locale: locale.value,
      name: name.value,
      site: site.value,
      state: state.value,
      uptime: uptime.value,
      expireTime: expireTime.value,
    }
  });

  const stateDataDefault: ServerStateData = {
    actions: ['purchase', 'signIn', 'signOut'],
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
    guid.value = data?.guid;
    locale.value = data?.locale;
    name.value = data?.name;
    site.value = data?.site;
    state.value = data?.state;
    uptime.value = data?.uptime;
    expireTime.value = data?.expireTime;
  };

  return {
    // state
    name,
    description,
    guid,
    locale,
    deviceCount,
    site,
    uptime,
    expireTime,
    state,
    // getters
    server,
    stateData,
    // actions
    setServer,
  };
});
