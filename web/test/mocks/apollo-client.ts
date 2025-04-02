import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { provideApolloClient } from '@vue/apollo-composable';
import type { WebSocket } from 'ws';

// Create a simple HTTP-only Apollo Client for testing
export function createTestApolloClient() {
  const httpLink = createHttpLink({
    uri: 'http://localhost:3000/graphql',
    fetch: (_input: RequestInfo | URL, _init?: RequestInit) => {
      // Mock the fetch response
      return Promise.resolve(new Response(JSON.stringify({ data: {} })));
    },
  });

  const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
  });

  // Provide the client to Vue Apollo
  provideApolloClient(client);

  return client;
}

// Export WebSocket type for use in other parts of the test setup
export type { WebSocket }; 