import { provideApolloClient } from '@vue/apollo-composable';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import { useApollo } from '~/composables/services/apollo';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

// @todo build URLs correctly
const WINDOW_URL = new URL(window.location.origin);
const httpEndpoint = `${WINDOW_URL.protocol}//${WINDOW_URL.host}/graphql`;
const wsProtocol = WINDOW_URL.protocol.includes('https') ? 'wss://' : 'ws://';
const wsEndpoint = `${wsProtocol}${WINDOW_URL.host}/graphql`;

export const useUnraidApiStore = defineStore('unraidApi', () => {
  console.debug('[useUnraidApiStore]');

  const createApolloClient = (apiKey: string) => {
    console.debug('[useUnraidApiStore] createClient');
    const { unraidApiClient } = useApollo({
      apiKey,
      httpEndpoint,
      wsEndpoint,
    });
    console.debug('[useUnraidApiStore] provideApolloClient', unraidApiClient.value);
    provideApolloClient(unraidApiClient.value);
  };

  return {
    createApolloClient,
  };
});
