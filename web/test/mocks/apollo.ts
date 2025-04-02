import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { provideApolloClient } from '@vue/apollo-composable';

// Create a simple HTTP link that doesn't use WebSocket
const httpLink = createHttpLink({
  uri: 'http://localhost/graphql',
  credentials: 'include',
});

// Create a mock Apollo client that only uses HTTP
export const mockApolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
  },
});

// Helper function to provide the mock client
export function provideMockApolloClient() {
  provideApolloClient(mockApolloClient);
} 