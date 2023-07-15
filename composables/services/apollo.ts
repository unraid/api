import { DefaultApolloClient } from '@vue/apollo-composable';
import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client/core';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

export interface ApolloClientPayload {
  apiKey: string;
  httpEndpoint: string;
  wsEndpoint: string;
}

const useApollo = (payload: ApolloClientPayload) => {
  console.debug('[useApollo.create]', payload);

  const unraidApiClient = ref<ApolloClient<any>>();

  // Create an http link:
  const httpLink = new HttpLink({
    uri: payload.httpEndpoint,
    headers: {
      'x-api-key': payload.apiKey,
    },
  });

  // Create a GraphQLWsLink link:
  const wsLink = new GraphQLWsLink(
    createClient({
      url: payload.wsEndpoint,
      connectionParams: () => ({
        headers: {
          'x-api-key': payload.apiKey,
        },
      }),
    }),
  );

  // using the ability to split links, you can send data to each link
  // depending on what kind of operation is being sent
  const link = split(
    // split based on operation type
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

  console.debug('[useApollo.create] link', link);

  // Create the apollo client with cache implementation.
  unraidApiClient.value = new ApolloClient({
    // link,
    cache: new InMemoryCache(),
  });

  return {
    unraidApiClient,
  };
};

export default useApollo;