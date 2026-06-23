import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { provideApolloClient } from '@vue/apollo-composable';

import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client/core';
import { beforeEach, vi } from 'vitest';

vi.mock('@vue/apollo-composable', async () => {
  const actual =
    await vi.importActual<typeof import('@vue/apollo-composable')>('@vue/apollo-composable');

  const useQueryMock = vi.fn(() => ({
    result: ref(null),
    loading: ref(false),
    onResult: vi.fn(),
    onError: vi.fn(),
  }));

  return {
    ...actual,
    useQuery: useQueryMock,
  };
});

// Provide a no-op default Apollo client for the whole test run. Even with
// useQuery mocked above, some components and generated composables resolve the
// default client asynchronously (e.g. during teardown, after the test that
// triggered them has finished). Without a provided client, @vue/apollo-composable
// throws "Apollo client with id default not found" as an unhandled rejection,
// polluting unrelated suites. A terminating link that emits an empty result keeps
// any stray operation quiet without making network calls.
provideApolloClient(
  new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink(() => Observable.of({ data: {} })),
  })
);

// Mock WebSocket for test environment
if (!global.WebSocket) {
  const mockWebSocket = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
    send: vi.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  }));

  // Add static properties to match WebSocket interface
  Object.defineProperty(mockWebSocket, 'CONNECTING', { value: 0 });
  Object.defineProperty(mockWebSocket, 'OPEN', { value: 1 });
  Object.defineProperty(mockWebSocket, 'CLOSING', { value: 2 });
  Object.defineProperty(mockWebSocket, 'CLOSED', { value: 3 });

  global.WebSocket = mockWebSocket as unknown as typeof WebSocket;
}

beforeEach(() => {
  const pinia = createPinia();
  setActivePinia(pinia);
});
