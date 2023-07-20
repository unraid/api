import { from, ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client/core/core.cjs';
import { onError } from '@apollo/client/link/error'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { provideApolloClient } from '@vue/apollo-composable';
import { logErrorMessages } from '@vue/apollo-util'
import { createClient } from 'graphql-ws';
import { defineStore, createPinia, setActivePinia } from 'pinia';

import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());
let baseUrl = window.location.origin
const localDevUrl = baseUrl.includes(':4321'); /** @todo use ENV */
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
  const errorsStore = useErrorsStore();
  const serverStore = useServerStore();

  const unraidApiClient = ref<ApolloClient<any>>();

  /**
   * Automatically called when an apiKey is set in the serverStore
   */
  const createApolloClient = (apiKey: string) => {
    console.debug('[useUnraidApiStore.createApolloClient]');

    const headers = { 'x-api-key': apiKey };

    const httpLink = new createHttpLink({
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
    const errorLink = onError((errors) => { 
      logErrorMessages(errors);
      // // { graphQLErrors, networkError }
      // if (graphQLErrors) {
      //   logErrorMessages(graphQLErrors);
      //   // graphQLErrors.map(({ message, locations, path }) => {
      //   //   // console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
      //   // })
      // }

      // if (networkError) {
      //   logErrorMessages(networkError);
      // }
    });

    const splitLinks = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
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

  watch(unraidApiClient, (newVal, oldVal) => {
    console.debug('[watch.unraidApiStore.unraidApiClient]', { newVal, oldVal });
    if (newVal && !oldVal) { // first time
      serverStore.fetchServerFromApi();
    }
  });

  return {
    unraidApiClient,
    createApolloClient,
  };
});
