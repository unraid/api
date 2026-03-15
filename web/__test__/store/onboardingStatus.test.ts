import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Ref } from 'vue';

import { useOnboardingDraftStore } from '~/components/Onboarding/store/onboardingDraft';
import { useOnboardingStore } from '~/components/Onboarding/store/onboardingStatus';
import { useServerStore } from '~/store/server';

type OnboardingQueryResult = {
  customization?: {
    onboarding?: {
      status?: 'INCOMPLETE' | 'UPGRADE' | 'DOWNGRADE' | 'COMPLETED';
      isPartnerBuild?: boolean;
      completed?: boolean;
      completedAtVersion?: string | null;
    } | null;
  };
};

const { state, refetchMock, useQueryMock } = vi.hoisted(() => ({
  state: {
    onboardingResult: null as unknown as Ref<OnboardingQueryResult | null>,
    onboardingLoading: null as unknown as Ref<boolean>,
    onboardingError: null as unknown as Ref<unknown>,
    osVersionRef: null as unknown as Ref<string>,
    hasResumableDraftRef: null as unknown as Ref<boolean>,
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
    state.hasResumableDraftRef = ref(false);
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

    vi.mocked(useOnboardingDraftStore).mockReturnValue({
      hasResumableDraft: state.hasResumableDraftRef,
    } as unknown as ReturnType<typeof useOnboardingDraftStore>);
  });

  it('blocks onboarding modal while the onboarding query is still loading', () => {
    state.onboardingResult.value = null;
    state.onboardingLoading.value = true;

    const store = useOnboardingStore();

    expect(store.canDisplayOnboardingModal).toBe(true);
    expect(store.shouldShowOnboarding).toBe(false);
  });

  it('blocks onboarding modal when the onboarding query errors and no draft exists', () => {
    state.onboardingResult.value = null;
    state.onboardingError.value = new Error('Network error');

    const store = useOnboardingStore();

    expect(store.hasOnboardingQueryError).toBe(true);
    expect(store.canDisplayOnboardingModal).toBe(false);
    expect(store.shouldShowOnboarding).toBe(false);
  });

  it('keeps onboarding modal display enabled when a resumable draft exists during an error', () => {
    state.onboardingResult.value = null;
    state.onboardingError.value = new Error('Network error');
    state.hasResumableDraftRef.value = true;

    const store = useOnboardingStore();

    expect(store.hasOnboardingQueryError).toBe(true);
    expect(store.canDisplayOnboardingModal).toBe(true);
    expect(store.shouldShowOnboarding).toBe(false);
  });

  it('allows onboarding modal when onboarding state is absent but there is no query error', () => {
    state.onboardingResult.value = {
      customization: {
        onboarding: null,
      },
    };

    const store = useOnboardingStore();

    expect(store.canDisplayOnboardingModal).toBe(true);
    expect(store.shouldShowOnboarding).toBe(false);
  });

  it('keeps onboarding modal display enabled when tracker state is missing but a draft exists', () => {
    state.onboardingResult.value = {
      customization: {
        onboarding: null,
      },
    };
    state.hasResumableDraftRef.value = true;

    const store = useOnboardingStore();

    expect(store.canDisplayOnboardingModal).toBe(true);
    expect(store.shouldShowOnboarding).toBe(false);
  });

  it('allows onboarding modal when the onboarding query succeeds', () => {
    const store = useOnboardingStore();

    expect(store.hasOnboardingQueryError).toBe(false);
    expect(store.canDisplayOnboardingModal).toBe(true);
    expect(store.shouldShowOnboarding).toBe(true);
  });

  it('keeps onboarding modal display enabled during refetch when onboarding data already exists', () => {
    state.onboardingLoading.value = true;

    const store = useOnboardingStore();

    expect(store.canDisplayOnboardingModal).toBe(true);
    expect(store.shouldShowOnboarding).toBe(true);
  });
});

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => useQueryMock(),
}));

vi.mock('~/components/Onboarding/store/onboardingDraft', () => ({
  useOnboardingDraftStore: vi.fn(),
}));

vi.mock('~/store/server', () => ({
  useServerStore: vi.fn(),
}));
