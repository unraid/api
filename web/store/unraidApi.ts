import {
  from,
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  split,
  // @ts-expect-error - CommonJS doesn't have type definitions
} from "@apollo/client/core/core.cjs";
import {
  type ApolloClient as ApolloClientType,
  type InMemoryCache as InMemoryCacheType,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { ArrowPathIcon, CogIcon } from '@heroicons/vue/24/solid';
import { provideApolloClient } from '@vue/apollo-composable';
// import { logErrorMessages } from '@vue/apollo-util';
import { createClient } from 'graphql-ws';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import type { UserProfileLink } from '~/types/userProfile';

import { WebguiUnraidApiCommand } from '~/composables/services/webgui';
import {
  WEBGUI_GRAPHQL,
  WEBGUI_SETTINGS_MANAGMENT_ACCESS,
} from '~/helpers/urls';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

const ERROR_CORS_403 =
  'The CORS policy for this site does not allow access from the specified Origin';

const httpEndpoint = WEBGUI_GRAPHQL;
const wsEndpoint = new URL(WEBGUI_GRAPHQL.toString().replace('http', 'ws'));

export const useUnraidApiStore = defineStore('unraidApi', () => {
  const errorsStore = useErrorsStore();
  const serverStore = useServerStore();
  const unraidApiClient = ref<ApolloClientType<InMemoryCacheType> | null>(null);
  watch(unraidApiClient, (newVal) => {
    if (newVal) {
      const apiResponse = serverStore.fetchServerFromApi();
      if (apiResponse) {
        // we have a response, so we're online
        unraidApiStatus.value = 'online';
      }
    }
  });

  // const unraidApiErrors = ref<any[]>([]);
  const unraidApiStatus = ref<
    'connecting' | 'offline' | 'online' | 'restarting'
  >('offline');
  const prioritizeCorsError = ref(false); // Ensures we don't overwrite this specific error message with a non-descriptive network error message

  const unraidApiRestartAction = computed((): UserProfileLink | undefined => {
    const { connectPluginInstalled, stateDataError } = serverStore;
    if (
      unraidApiStatus.value !== 'offline' ||
      !connectPluginInstalled ||
      stateDataError
    ) {
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

    // const headers = { 'x-api-key': serverStore.apiKey };
    const headers = {};

    const httpLink = createHttpLink({
      uri: httpEndpoint.toString(),
      headers,
      credentials: "include",
    });

    const wsLink = new GraphQLWsLink(
      createClient({
        url: wsEndpoint.toString(),
        connectionParams: () => ({
          headers,
        }),
      })
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorLink = onError(({ graphQLErrors, networkError }: any) => {
      if (graphQLErrors) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        graphQLErrors.map((error: any) => {
          console.error('[GraphQL error]', error);
          const errorMsg =
            error.error && error.error.message
              ? error.error.message
              : error.message;
          if (errorMsg && errorMsg.includes('offline')) {
            unraidApiStatus.value = 'offline';
            // attempt to automatically restart the unraid-api
            if (unraidApiRestartAction) {
              restartUnraidApiClient();
            }
          }
          if (errorMsg && errorMsg.includes(ERROR_CORS_403)) {
            prioritizeCorsError.value = true;
            const msg = `<p>The CORS policy for the unraid-api does not allow access from the specified origin.</p><p>If you are using a reverse proxy, you need to copy your origin <strong class="font-mono"><em>${window.location.origin}</em></strong> and paste it into the "Extra Origins" list in the Connect settings.</p>`;
            errorsStore.setError({
              heading: 'Unraid API • CORS Error',
              message: msg,
              level: 'error',
              ref: 'unraidApiCorsError',
              type: 'unraidApiGQL',
              actions: [
                {
                  href: `${WEBGUI_SETTINGS_MANAGMENT_ACCESS.toString()}#extraOriginsSettings`,
                  icon: CogIcon,
                  text: 'Go to Connect Settings',
                },
              ],
            });
          }
          return error.message;
        });
      }

      if (networkError && !prioritizeCorsError) {
        console.error(`[Network error]: ${networkError}`);
        const msg = networkError.message ? networkError.message : networkError;
        if (
          typeof msg === 'string' &&
          msg.includes('Unexpected token < in JSON at position 0')
        ) {
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

    interface Definintion {
      kind: string;
      operation?: string;
    }
    const splitLinks = split(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ query }: any) => {
        const definition: Definintion = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink
    );
    /**
     * @todo as we add retries, determine which we'll need
     * https://www.apollographql.com/docs/react/api/link/introduction/#additive-composition
     * https://www.apollographql.com/docs/react/api/link/introduction/#directional-composition
     */
    const additiveLink = from([errorLink, retryLink, splitLinks]);

    const client: ApolloClientType<InMemoryCacheType> = new ApolloClient({
      link: additiveLink,
      cache: new InMemoryCache(),
    });
    unraidApiClient.value = client;

    provideApolloClient(client);
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
    unraidApiClient.value = null;
    unraidApiStatus.value = "offline";
  };
  /**
   * Can both start and restart the unraid-api depending on it's current status
   */
  const restartUnraidApiClient = async () => {
    const command = unraidApiStatus.value === 'offline' ? 'start' : 'restart';
    unraidApiStatus.value = 'restarting';
    try {
      await WebguiUnraidApiCommand({
        csrf_token: serverStore.csrf,
        command,
      });
      return setTimeout(() => {
        if (unraidApiClient.value) {
          createApolloClient();
        }
      }, 5000);
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (typeof error === 'string') {
        errorMessage = error.toUpperCase();
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      errorsStore.setError({
        heading: 'Error: unraid-api restart',
        message: errorMessage,
        level: 'error',
        ref: 'restartUnraidApiClient',
        type: 'request',
      });
    }
  };

  return {
    unraidApiClient,
    unraidApiStatus,
    prioritizeCorsError,
    unraidApiRestartAction,
    createApolloClient,
    closeUnraidApiClient,
    restartUnraidApiClient,
  };
});
