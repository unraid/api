import { ref } from 'vue';
import { vi } from 'vitest';

// Types for mock data
export interface MockLogFile {
  content: string;
  totalLines: number;
  startLine: number;
}

export interface MockQueryResult {
  logFile: MockLogFile;
}

/**
 * Creates a mock useQuery return value with optional result data
 * Using unknown return type to avoid complex Apollo type issues in tests
 */
export function createMockUseQuery<TData = unknown>(
  resultData: TData | null = null,
  options: {
    loading?: boolean;
    error?: unknown;
  } = {}
): unknown {
  return {
    result: ref(resultData),
    loading: ref(options.loading ?? false),
    error: ref(options.error ?? null),
    refetch: vi.fn(() => Promise.resolve({
      data: resultData || {},
      loading: false,
      networkStatus: 7,
      stale: false,
      error: undefined
    })),
    subscribeToMore: vi.fn(),
    networkStatus: ref(7),
    start: vi.fn(),
    stop: vi.fn(),
    restart: vi.fn(),
    forceDisabled: ref(false),
    document: ref(null),
    variables: ref({}),
    options: {},
    query: ref(null),
    fetchMore: vi.fn(),
    updateQuery: vi.fn(),
    onResult: vi.fn(),
    onError: vi.fn()
  };
}

/**
 * Creates a mock useQuery specifically for log file data
 */
export function createMockLogFileQuery(
  content: string,
  totalLines: number,
  startLine: number = 1
): unknown {
  const result: MockQueryResult = {
    logFile: {
      content,
      totalLines,
      startLine
    }
  };
  
  return createMockUseQuery(result);
}

/**
 * Helper to mock the entire @vue/apollo-composable module
 */
export function mockApolloComposable() {
  vi.mock('@vue/apollo-composable', () => ({
    useApolloClient: vi.fn(() => ({
      client: {
        query: vi.fn()
      }
    })),
    useQuery: vi.fn(() => createMockUseQuery())
  }));
}
