import { provideApolloClient } from '@vue/apollo-composable';

import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core';

// Types for Apollo Client options
interface TestApolloClientOptions {
  uri?: string;
  mockData?: Record<string, unknown>;
}

// Single function to create Apollo clients
function createClient(options: TestApolloClientOptions = {}) {
  const { uri = 'http://localhost/graphql', mockData = { data: {} } } = options;

  return new ApolloClient({
    link: createHttpLink({
      uri,
      credentials: 'include',
      fetch: () => Promise.resolve(new Response(JSON.stringify(mockData))),
    }),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
      },
    },
  });
}

// Default mock client
export const mockApolloClient = createClient();

// Helper function to provide the mock client
export function provideMockApolloClient() {
  provideApolloClient(mockApolloClient);

  return mockApolloClient;
}

// Create a customizable Apollo Client
export function createTestApolloClient(options: TestApolloClientOptions = {}) {
  const client = createClient(options);

  provideApolloClient(client);

  return client;
}
