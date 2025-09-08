import { ApolloClient, ApolloLink, createHttpLink, from, split } from '@apollo/client/core/index.js';
import { onError } from '@apollo/client/link/error/index.js';
import { RetryLink } from '@apollo/client/link/retry/index.js';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions/index.js';
import { getMainDefinition } from '@apollo/client/utilities/index.js';
import { createApolloCache } from '~/helpers/apollo-cache';
import { WEBGUI_GRAPHQL } from '~/helpers/urls';
import { createClient } from 'graphql-ws';

import type { ErrorResponse } from '@apollo/client/link/error/index.js';
import type { GraphQLFormattedError } from 'graphql';

// Allow overriding the GraphQL endpoint for development/testing
declare global {
  interface Window {
    GRAPHQL_ENDPOINT?: string;
  }
}

const getGraphQLEndpoint = () => {
  if (typeof window !== 'undefined' && window.GRAPHQL_ENDPOINT) {
    return new URL(window.GRAPHQL_ENDPOINT);
  }
  return WEBGUI_GRAPHQL;
};

const httpEndpoint = getGraphQLEndpoint();
const wsEndpoint = new URL(httpEndpoint.toString());
wsEndpoint.protocol = httpEndpoint.protocol === 'https:' ? 'wss:' : 'ws:';
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

const errorLink = onError(({ graphQLErrors, networkError }: ErrorResponse) => {
  if (graphQLErrors) {
    graphQLErrors.forEach((error: GraphQLFormattedError) => {
      console.error('[GraphQL error]', error);
      const errorMsg =
        (error as GraphQLFormattedError & { error?: { message?: string } }).error?.message ??
        error.message;
      if (errorMsg?.includes('offline')) {
        // @todo restart the api, but make sure not to trigger infinite loop
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    const msg = networkError.message ? networkError.message : networkError;
    if (typeof msg === 'string' && msg.includes('Unexpected token < in JSON at position 0')) {
      console.error('Unraid API • CORS Error');
    }
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

// Disable Apollo Client if not in DEV Mode and server state says unraid-api is not running
const disableQueryLink = new ApolloLink((operation, forward) => {
  if (!DEV_MODE && operation.getContext().serverState?.unraidApi?.status === 'offline') {
    return null;
  }
  return forward(operation);
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
const additiveLink = from([errorLink, retryLink, disableQueryLink, splitLinks]);

export const client = new ApolloClient({
  link: additiveLink,
  cache: createApolloCache(),
});
