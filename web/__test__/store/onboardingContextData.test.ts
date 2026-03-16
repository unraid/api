import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ONBOARDING_BOOTSTRAP_QUERY } from '~/components/Onboarding/graphql/onboardingBootstrap.query';
import { useOnboardingContextDataStore } from '~/components/Onboarding/store/onboardingContextData';

const createCompleteQueryMock = <T>(
  result: T | null = null,
  loading = false,
  error: unknown = null
) => ({
  result: ref(result),
  loading: ref(loading),
  error: ref(error),
  networkStatus: ref(7),
  called: ref(true),
  variables: ref({}),
  document: ref(null),
  query: ref(null),
  forceDisabled: ref(false),
  options: { errorPolicy: 'all' as const, fetchPolicy: 'cache-and-network' as const },
  stop: vi.fn(),
  start: vi.fn(),
  restart: vi.fn(),
  refetch: vi.fn(),
  fetchMore: vi.fn(),
  onResult: vi.fn(),
  onError: vi.fn(),
  subscribeToMore: vi.fn(),
  updateQuery: vi.fn(),
});

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

describe('OnboardingContextData Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('loads the shared onboarding bootstrap query', () => {
    vi.mocked(useQuery).mockImplementation((query) => {
      if (query === ONBOARDING_BOOTSTRAP_QUERY) {
        return createCompleteQueryMock(
          {
            customization: {
              activationCode: { code: 'ABC-123' },
              onboarding: {
                status: 'INCOMPLETE',
                onboardingState: { isFreshInstall: true },
              },
            },
            vars: {
              bootedFromFlashWithInternalBootSetup: false,
              enableBootTransfer: 'yes',
            },
          },
          false
        );
      }

      return createCompleteQueryMock(null, false);
    });

    const store = useOnboardingContextDataStore();

    expect(store.activationCode).toEqual({ code: 'ABC-123' });
    expect(store.onboarding).toMatchObject({ status: 'INCOMPLETE' });
    expect(store.onboardingState).toMatchObject({ isFreshInstall: true });
    expect(store.internalBootVisibility).toEqual({
      bootedFromFlashWithInternalBootSetup: false,
      enableBootTransfer: 'yes',
    });
    expect(store.loading).toBe(false);
  });

  it('exposes query loading and error state', () => {
    const queryError = new Error('bootstrap failed');

    vi.mocked(useQuery).mockImplementation((query) => {
      if (query === ONBOARDING_BOOTSTRAP_QUERY) {
        return createCompleteQueryMock(null, true, queryError);
      }

      return createCompleteQueryMock(null, false);
    });

    const store = useOnboardingContextDataStore();

    expect(store.loading).toBe(true);
    expect(store.error).toBe(queryError);
    expect(store.onboarding).toBeNull();
    expect(store.activationCode).toBeNull();
    expect(store.internalBootVisibility).toBeNull();
  });
});
