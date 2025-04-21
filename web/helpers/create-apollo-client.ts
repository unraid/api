import { ApolloClient, createHttpLink, from, split } from '@apollo/client/core/index.js';
import { onError } from '@apollo/client/link/error/index.js';
import { RetryLink } from '@apollo/client/link/retry/index.js';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions/index.js';
import { getMainDefinition } from '@apollo/client/utilities/index.js';
import { provideApolloClient } from '@vue/apollo-composable';
import { createClient } from 'graphql-ws';
import { createApolloCache } from './apollo-cache';
import { WEBGUI_GRAPHQL } from './urls';

const httpEndpoint = WEBGUI_GRAPHQL;
const wsEndpoint = new URL(WEBGUI_GRAPHQL.toString().replace('http', 'ws'));
const DEV_MODE = (globalThis as unknown as { __DEV__: boolean }).__DEV__ ?? false;

const headers = {
  'x-csrf-token': globalThis.csrf_token ?? '0000000000000000',
};

const httpLink = createHttpLink({
  uri: httpEndpoint.toString(),
  headers,
  credentials: 'include',
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: wsEndpoint.toString(),
    connectionParams: () => headers,
  })
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorLink = onError(({ graphQLErrors, networkError }: any) => {
  if (graphQLErrors) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    graphQLErrors.map((error: any) => {
      console.error('[GraphQL error]', error);
      const errorMsg = error.error?.message ?? error.message;
      if (errorMsg?.includes('offline')) {
        // @todo restart the api, but make sure not to trigger infinite loop
      }
      return error.message;
    });
  }

  if (networkError) {
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
      return Boolean(error);
    },
  },
  delay: {
    initial: 300,
    max: 10000,
    jitter: true,
  },
});

const splitLinks = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
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

export const client = new ApolloClient({
  link: additiveLink,
  cache: createApolloCache(),
});

provideApolloClient(client);