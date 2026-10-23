import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { provideApolloClient } from '@vue/apollo-composable';

import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client/core';
import { beforeEach, vi } from 'vitest';

vi.mock('dompurify', async () => {
  const [{ JSDOM }, { default: createDOMPurify }] = await Promise.all([
    import('jsdom'),
    vi.importActual<typeof import('dompurify')>('dompurify'),
  ]);
  const { window } = new JSDOM('<!doctype html><html><body></body></html>');

  return {
    default: createDOMPurify(window),
  };
});

class MemoryStorage implements Storage {
  [name: string]: unknown;

  readonly #items = new Map<string, string>();

  get length() {
    return this.#items.size;
  }

  clear() {
    for (const key of this.#items.keys()) {
      delete this[key];
    }
    this.#items.clear();
  }

  getItem(key: string) {
    return this.#items.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.#items.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.#items.delete(key);
    delete this[key];
  }

  setItem(key: string, value: string) {
    this.#items.set(key, value);
    Object.defineProperty(this, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
}

const createStorage = (): Storage => {
  return new MemoryStorage();
};

const localStorageMock = createStorage();
const sessionStorageMock = createStorage();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  configurable: true,
});

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  configurable: true,
});

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
