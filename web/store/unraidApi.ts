import { from, ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client/core/core.cjs';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { ArrowPathIcon, CogIcon } from '@heroicons/vue/24/solid';
import { provideApolloClient } from '@vue/apollo-composable';
// import { logErrorMessages } from '@vue/apollo-util';
import { createClient } from 'graphql-ws';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import { UserProfileLink } from 'types/userProfile';

import { WebguiUnraidApiCommand } from '~/composables/services/webgui';
import { GRAPHQL, PLUGIN_SETTINGS } from '~/helpers/urls';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

const ERROR_CORS_403 = 'The CORS policy for this site does not allow access from the specified Origin';
let prioritizeCorsError = false; // Ensures we don't overwrite this specific error message with a non-descriptive network error message

const httpEndpoint = GRAPHQL;
const wsEndpoint = new URL(GRAPHQL.toString().replace('http', 'ws'));

export const useUnraidApiStore = defineStore('unraidApi', () => {
  const errorsStore = useErrorsStore();
  const serverStore = useServerStore();

  const unraidApiClient = ref<ApolloClient<any>>();
  watch(unraidApiClient, (newVal) => {
    if (newVal) {
      const apiResponse = serverStore.fetchServerFromApi();
      if (apiResponse) {
        // we have a response, so we're online
        unraidApiStatus.value = 'online';

        const msg = `<p>The CORS policy for this site does not allow access from the specified Origin'./p><p>If you are using a reverse proxy, you need to copy your origin <strong class="font-mono"><em>${window.location.origin}</em></strong> and paste it into the "Extra Origins" list in the Connect settings.</p>`;
        errorsStore.setError({
          heading: 'Unraid API • CORS Error',
          message: msg,
          level: 'error',
          ref: 'unraidApiCorsError',
          type: 'unraidApiGQL',
          actions: [
            {
              href: `${PLUGIN_SETTINGS.toString()}#extraOriginsSettings`,
              icon: CogIcon,
              text: 'Go to Connect Settings',
            }
          ],
        });
      }
    }
  });

  // const unraidApiErrors = ref<any[]>([]);
  const unraidApiStatus = ref<'connecting' | 'offline' | 'online' | 'restarting'>('offline');

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
    // return; // @todo remove
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
        graphQLErrors.map((error) => {
          console.error('[GraphQL error]', error, error.error.message);
          if (error.error.message.includes('offline')) {
            unraidApiStatus.value = 'offline';
            // attempt to automatically restart the unraid-api
            if (unraidApiRestartAction) { restartUnraidApiClient(); }
          }
          if (error.error.message && error.error.message.includes(ERROR_CORS_403)) {
            prioritizeCorsError = true;
            const msg = `<p>${error.error.message}</p><p>If you are using a reverse proxy, you need to copy your origin <strong class="font-mono"><em>${window.location.origin}</em></strong> and paste it into the "Extra Origins" list in the Connect settings.</p>`;
            errorsStore.setError({
              heading: 'Unraid API • CORS Error',
              message: msg,
              level: 'error',
              ref: 'unraidApiCorsError',
              type: 'unraidApiGQL',
              actions: [
                {
                  href: `${PLUGIN_SETTINGS.toString()}#extraOriginsSettings`,
                  icon: CogIcon,
                  text: 'Go to Connect Settings',
                }
              ],
            });
          }
          return error.message;
        });
      }

      if (networkError && !prioritizeCorsError) {
        console.error(`[Network error]: ${networkError}`);
        const msg = networkError.message ? networkError.message : networkError;
        if (typeof msg === 'string' && msg.includes('Unexpected token < in JSON at position 0')) {
          return 'Unraid API • CORS Error';
        }
        return msg;
      }
    });

    const retryLink = new RetryLink({
      attempts: {
        max: 20,
        retryIf: (error, _operation) => {
          return !!error && !prioritizeCorsError; // don't retry when ERROR_CORS_403
        },
      },
      delay: {
        initial: prioritizeCorsError ? 3000 : 300,
        max: 10000,
        jitter: true,
      },
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
      retryLink,
      splitLinks,
    ]);

    unraidApiClient.value = new ApolloClient({
      link: additiveLink,
      cache: new InMemoryCache(),
    });

    provideApolloClient(unraidApiClient.value);
  };
  /**
   * Automatically called when an apiKey is unset in the serverStore
   */
  const closeUnraidApiClient = async () => {
    if (!unraidApiClient.value) {
      return;
    }
    if (unraidApiClient.value) {
      await unraidApiClient.value.clearStore();
      unraidApiClient.value.stop();
      // (wsLink.value as any).subscriptionClient.close(); // needed if we start using subscriptions
    }
    unraidApiClient.value = undefined;
    unraidApiStatus.value = 'offline';
  };
  /**
   * Can both start and restart the unraid-api depending on it's current status
   */
  const restartUnraidApiClient = async () => {
    const command = unraidApiStatus.value === 'offline' ? 'start' : 'restart';
    console.debug('[restartUnraidApiClient]', { command });
    unraidApiStatus.value = 'restarting';
    try {
      const response = await WebguiUnraidApiCommand({
        csrf_token: serverStore.csrf,
        command,
      });
      console.debug('[restartUnraidApiClient] response', response);
      return setTimeout(() => {
        if (unraidApiClient.value) {
          createApolloClient();
        }
      }, 5000);
    } catch (error) {
      errorsStore.setError(error);
    }
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
