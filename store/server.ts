import { defineStore, createPinia, setActivePinia } from "pinia";
import type { Server, ServerState } from '~/types/server';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useServerStore = defineStore('server', () => {
  const description = ref<string | undefined>();
  const deviceCount = ref<number | undefined>();
  const guid = ref<string | undefined>();
  const keyTypeForPurchase = ref<string | undefined>();
  const locale = ref<string | undefined>();
  const name = ref<string | undefined>();
  const site = ref<string | undefined>();
  const state = ref<string | undefined>(); // @todo implement ServerState ENUM

  const server = computed<Server>(() => {
    return {
      description: description.value,
      deviceCount: deviceCount.value,
      guid: guid.value,
      keyTypeForPurchase: keyTypeForPurchase.value,
      locale: locale.value,
      name: name.value,
      site: site.value,
      state: state.value,
    }
  });

  const setServer = (server: Server) => {
    console.debug('[setServer]', server);
    description.value = server?.description;
    deviceCount.value = server?.deviceCount;
    guid.value = server?.guid;
    keyTypeForPurchase.value = server?.keyTypeForPurchase;
    locale.value = server?.locale;
    name.value = server?.name;
    site.value = server?.site;
    state.value = server?.state;
  };

  return { name, description, guid, keyTypeForPurchase, locale, deviceCount, site, server, setServer };
});
