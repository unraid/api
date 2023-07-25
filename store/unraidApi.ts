import { from, ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client/core/core.cjs';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { ArrowPathIcon } from '@heroicons/vue/24/solid';
import { provideApolloClient } from '@vue/apollo-composable';
// import { logErrorMessages } from '@vue/apollo-util';
import { createClient } from 'graphql-ws';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import { UserProfileLink } from 'types/userProfile';

import { WebguiUnraidApiCommand } from '~/composables/services/webgui';
import { useAccountStore } from '~/store/account';
// import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

let baseUrl = window.location.origin;
/** @todo use ENV */
const localDevUrl = baseUrl.includes(':4321');
if (localDevUrl) {
  /** @temp local dev mode */
  baseUrl = baseUrl.replace(':4321', ':3001');
}
const httpEndpoint = new URL('/graphql', baseUrl);
const wsEndpoint = new URL('/graphql', baseUrl.replace('http', 'ws'));

console.debug('[useUnraidApiStore] httpEndpoint', httpEndpoint.toString());
console.debug('[useUnraidApiStore] wsEndpoint', wsEndpoint.toString());

export const useUnraidApiStore = defineStore('unraidApi', () => {
  console.debug('[useUnraidApiStore]');
  const accountStore = useAccountStore();
  // const errorsStore = useErrorsStore();
  const serverStore = useServerStore();

  const unraidApiClient = ref<ApolloClient<any>>();
  watch(unraidApiClient, (newVal, oldVal) => {
    console.debug('[watch:unraidApiStore.unraidApiClient]', { newVal, oldVal });
    if (newVal) {
      const apiResponse = serverStore.fetchServerFromApi();
      if (apiResponse) {
        // we have a response, so we're online
        unraidApiStatus.value = 'online';
      }
    }
  });

  // const unraidApiErrors = ref<any[]>([]);
  const unraidApiStatus = ref<'connecting' | 'offline' | 'online' | 'restarting'>('offline');
  watch(unraidApiStatus, (newVal, oldVal) => {
    console.debug('[watch:unraidApiStore.unraidApiStatus]', { newVal, oldVal });
  });

  const unraidApiRestartAction = computed((): UserProfileLink | undefined => {
    const { connectPluginInstalled, stateDataError } = serverStore;
    if (unraidApiStatus.value !== 'offline' || !connectPluginInstalled || stateDataError) {
      return undefined;
    }
    return {
      click: () => restartUnraidApiClient(),
      emphasize: true,
      icon: ArrowPathIcon,
      text: 'Restart unraid-api',
    };
  });

  /**
   * Automatically called when an apiKey is set in the serverStore
   */
  const createApolloClient = () => {
    console.debug('[useUnraidApiStore.createApolloClient]', serverStore.apiKey);
    if (accountStore.accountActionType === 'signOut') {
      return console.debug('[useUnraidApiStore.createApolloClient] sign out imminent, skipping createApolloClient');
    }

    unraidApiStatus.value = 'connecting';

    const headers = { 'x-api-key': serverStore.apiKey };

    const httpLink = createHttpLink({
      uri: httpEndpoint.toString(),
      headers,
    });

    const wsLink = new GraphQLWsLink(
      createClient({
        url: wsEndpoint.toString(),
        connectionParams: () => ({
          headers,
        }),
      }),
    );

    /**
     * @todo integrate errorsStore errorsStore.setError(error);
     */
    const errorLink = onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        console.debug('[GraphQL error]', graphQLErrors);
        graphQLErrors.map((error) => {
          console.error('[GraphQL error]', error, error.error.message);
          if (error.error.message.includes('offline')) {
            unraidApiStatus.value = 'offline';
          }
          return error.message;
        });
        console.debug('[GraphQL error]', graphQLErrors);
      }

      if (networkError) {
        console.error(`[Network error]: ${networkError}`);
      }
    });

    const splitLinks = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink,
    );
    /**
     * @todo as we add retries, determine which we'll need
     * https://www.apollographql.com/docs/react/api/link/introduction/#additive-composition
     * https://www.apollographql.com/docs/react/api/link/introduction/#directional-composition
     */
    const additiveLink = from([
      errorLink,
      splitLinks,
    ]);

    unraidApiClient.value = new ApolloClient({
      link: additiveLink,
      cache: new InMemoryCache(),
    });

    provideApolloClient(unraidApiClient.value);
    console.debug('[useUnraidApiStore.createApolloClient] 🏁 CREATED');
  };
  /**
   * Automatically called when an apiKey is unset in the serverStore
   */
  const closeUnraidApiClient = async () => {
    console.debug('[useUnraidApiStore.closeUnraidApiClient] STARTED');
    if (!unraidApiClient.value) { return console.debug('[useUnraidApiStore.closeUnraidApiClient] unraidApiClient not set'); }
    if (unraidApiClient.value) {
      await unraidApiClient.value.clearStore();
      unraidApiClient.value.stop();
      // (wsLink.value as any).subscriptionClient.close(); // needed if we start using subscriptions
    }
    unraidApiClient.value = undefined;
    unraidApiStatus.value = 'offline';
    console.debug('[useUnraidApiStore.closeUnraidApiClient] DONE');
  };

  const restartUnraidApiClient = async () => {
    unraidApiStatus.value = 'restarting';
    const response = await WebguiUnraidApiCommand({
      csrf_token: serverStore.csrf,
      command: 'start',
    });
    console.debug('[restartUnraidApiClient]', response);
    return setTimeout(() => {
      if (unraidApiClient.value) {
        createApolloClient();
      }
    }, 5000);
  };

  return {
    unraidApiClient,
    unraidApiStatus,
    unraidApiRestartAction,
    createApolloClient,
    closeUnraidApiClient,
    restartUnraidApiClient,
  };
});
