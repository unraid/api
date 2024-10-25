import {
  from,
  ApolloClient,
  createHttpLink,
  split,
  type NormalizedCacheObject,
} from "@apollo/client/core";

import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { provideApolloClient } from "@vue/apollo-composable";
import { createClient } from "graphql-ws";
import { WEBGUI_GRAPHQL } from "./urls";
import { createApolloCache } from "./apollo-cache";
import { ApolloLink, Observable } from "@apollo/client/core";
import fs from "fs";
import path from "path";
import { useServerStore } from "~/store/server";
import { connect } from "http2";

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

const disableClientLink = new ApolloLink((operation, forward) => {
  const serverStore = useServerStore();
  const { connectPluginInstalled, guid} = toRefs(serverStore);
  console.log("serverStore.connectPluginInstalled", connectPluginInstalled.value, guid.value);
  if (!connectPluginInstalled.value) {
    return new Observable((observer) => {
      console.warn("connectPluginInstalled is false, aborting request");
      observer.complete();
    });
  }
  return forward(operation);
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
  httpLink
);
/**
 * @todo as we add retries, determine which we'll need
 * https://www.apollographql.com/docs/react/api/link/introduction/#additive-composition
 * https://www.apollographql.com/docs/react/api/link/introduction/#directional-composition
 */
const additiveLink = from([disableClientLink, errorLink, retryLink, splitLinks]);

export const client = new ApolloClient({
  link: additiveLink,
  cache: createApolloCache(),
});

provideApolloClient(client);
