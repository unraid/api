import type {
  split as SplitType,
  ApolloClient as ApolloClientType,
  InMemoryCache as InMemoryCacheType,
} from "@apollo/client";

import {
  from,
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  split,
  // @ts-expect-error - CommonJS doesn't have type definitions
} from "@apollo/client/core/core.cjs";

import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { provideApolloClient } from "@vue/apollo-composable";
import { createClient } from "graphql-ws";
import { WEBGUI_GRAPHQL } from "./urls";

const httpEndpoint = WEBGUI_GRAPHQL;
const wsEndpoint = new URL(WEBGUI_GRAPHQL.toString().replace("http", "ws"));

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
      console.error("[GraphQL error]", error);
      const errorMsg =
        error.error && error.error.message
          ? error.error.message
          : error.message;
      if (errorMsg && errorMsg.includes("offline")) {
        // @todo restart the api
      }
      return error.message;
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    const msg = networkError.message ? networkError.message : networkError;
    if (
      typeof msg === "string" &&
      msg.includes("Unexpected token < in JSON at position 0")
    ) {
      return "Unraid API • CORS Error";
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

const splitLinks = (split as typeof SplitType)(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
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

provideApolloClient(client);
