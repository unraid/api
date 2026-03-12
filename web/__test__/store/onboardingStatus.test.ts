import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useOnboardingStore } from '~/components/Onboarding/store/onboardingStatus';
import { useServerStore } from '~/store/server';

type OnboardingQueryResult = {
  customization?: {
    onboarding?: {
      status?: 'INCOMPLETE' | 'UPGRADE' | 'DOWNGRADE' | 'COMPLETED';
      isPartnerBuild?: boolean;
      completed?: boolean;
      completedAtVersion?: string | null;
    };
  };
};

const { state, refetchMock, useQueryMock } = vi.hoisted(() => ({
  state: {
    onboardingResult: null as unknown as ReturnType<typeof ref<OnboardingQueryResult | null>>,
    onboardingLoading: null as unknown as ReturnType<typeof ref<boolean>>,
    onboardingError: null as unknown as ReturnType<typeof ref<unknown>>,
    osVersionRef: null as unknown as ReturnType<typeof ref<string>>,
  },
  refetchMock: vi.fn(),
  useQueryMock: vi.fn(),
}));

const createOnboardingResult = (): OnboardingQueryResult => ({
  customization: {
    onboarding: {
      status: 'INCOMPLETE',
      isPartnerBuild: false,
      completed: false,
      completedAtVersion: null,
    },
  },
});

describe('onboardingStatus store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());

    state.onboardingResult = ref<OnboardingQueryResult | null>(createOnboardingResult());
    state.onboardingLoading = ref(false);
    state.onboardingError = ref(null);
    state.osVersionRef = ref('7.3.0');
    refetchMock.mockResolvedValue(undefined);

    useQueryMock.mockReturnValue({
      result: state.onboardingResult,
      loading: state.onboardingLoading,
      error: state.onboardingError,
      refetch: refetchMock,
    });

    vi.mocked(useServerStore).mockReturnValue({
      osVersion: state.osVersionRef,
    } as unknown as ReturnType<typeof useServerStore>);
  });

  it('blocks onboarding modal while the onboarding query is still loading', () => {
    state.onboardingLoading.value = true;

    const store = useOnboardingStore();

    expect(store.canDisplayOnboardingModal).toBe(false);
    expect(store.shouldShowOnboarding).toBe(false);
  });

  it('blocks onboarding modal when the onboarding query errors', () => {
    state.onboardingError.value = new Error('Network error');

    const store = useOnboardingStore();

    expect(store.hasOnboardingQueryError).toBe(true);
    expect(store.canDisplayOnboardingModal).toBe(false);
    expect(store.shouldShowOnboarding).toBe(false);
  });

  it('allows onboarding modal when the onboarding query succeeds', () => {
    const store = useOnboardingStore();

    expect(store.hasOnboardingQueryError).toBe(false);
    expect(store.canDisplayOnboardingModal).toBe(true);
    expect(store.shouldShowOnboarding).toBe(true);
  });
});

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => useQueryMock(),
}));

vi.mock('~/store/server', () => ({
  useServerStore: vi.fn(),
}));
