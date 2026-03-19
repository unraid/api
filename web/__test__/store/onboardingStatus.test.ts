import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Ref } from 'vue';

import { useOnboardingContextDataStore } from '~/components/Onboarding/store/onboardingContextData';
import { useOnboardingStore } from '~/components/Onboarding/store/onboardingStatus';
import { useServerStore } from '~/store/server';

type OnboardingData = {
  status?: 'INCOMPLETE' | 'UPGRADE' | 'DOWNGRADE' | 'COMPLETED';
  isPartnerBuild?: boolean;
  completed?: boolean;
  completedAtVersion?: string | null;
} | null;

const { state, refetchMock } = vi.hoisted(() => ({
  state: {
    onboardingData: null as unknown as Ref<OnboardingData>,
    onboardingLoading: null as unknown as Ref<boolean>,
    onboardingError: null as unknown as Ref<unknown>,
    osVersionRef: null as unknown as Ref<string>,
  },
  refetchMock: vi.fn(),
}));

const createOnboardingData = (): NonNullable<OnboardingData> => ({
  status: 'INCOMPLETE',
  isPartnerBuild: false,
  completed: false,
  completedAtVersion: null,
});

describe('onboardingStatus store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());

    state.onboardingData = ref<OnboardingData>(createOnboardingData());
    state.onboardingLoading = ref(false);
    state.onboardingError = ref(null);
    state.osVersionRef = ref('7.3.0');
    refetchMock.mockResolvedValue(undefined);

    vi.mocked(useServerStore).mockReturnValue({
      osVersion: state.osVersionRef,
    } as unknown as ReturnType<typeof useServerStore>);

    vi.mocked(useOnboardingContextDataStore).mockReturnValue({
      onboarding: state.onboardingData,
      loading: state.onboardingLoading,
      error: state.onboardingError,
      refetchOnboardingContext: refetchMock,
    } as unknown as ReturnType<typeof useOnboardingContextDataStore>);
  });

  it('blocks auto-show while the onboarding query is still loading', () => {
    state.onboardingData.value = null;
    state.onboardingLoading.value = true;

    const store = useOnboardingStore();

    expect(store.canDisplayOnboardingModal).toBe(true);
    expect(store.shouldShowOnboarding).toBe(false);
  });

  it('blocks onboarding modal when the onboarding query errors', () => {
    state.onboardingData.value = null;
    state.onboardingError.value = new Error('Network error');

    const store = useOnboardingStore();

    expect(store.hasOnboardingError).toBe(true);
    expect(store.canDisplayOnboardingModal).toBe(false);
    expect(store.shouldShowOnboarding).toBe(false);
  });

  it('allows onboarding modal when onboarding state is absent but there is no query error', () => {
    state.onboardingData.value = null;

    const store = useOnboardingStore();

    expect(store.canDisplayOnboardingModal).toBe(true);
    expect(store.shouldShowOnboarding).toBe(false);
  });

  it('allows onboarding modal when the onboarding query succeeds', () => {
    const store = useOnboardingStore();

    expect(store.hasOnboardingError).toBe(false);
    expect(store.canDisplayOnboardingModal).toBe(true);
    expect(store.shouldShowOnboarding).toBe(true);
  });

  it('blocks onboarding modal when onboarding data exists alongside an Apollo error', () => {
    state.onboardingError.value = new Error('Partial data error');

    const store = useOnboardingStore();

    expect(store.hasOnboardingError).toBe(true);
    expect(store.canDisplayOnboardingModal).toBe(false);
    expect(store.shouldShowOnboarding).toBe(false);
  });

  it('keeps onboarding modal display enabled during refetch when onboarding data already exists', () => {
    state.onboardingLoading.value = true;

    const store = useOnboardingStore();

    expect(store.canDisplayOnboardingModal).toBe(true);
    expect(store.shouldShowOnboarding).toBe(true);
  });

  it('does not auto-complete upgrade onboarding through the incomplete-only helper', () => {
    state.onboardingData.value = {
      status: 'UPGRADE',
      isPartnerBuild: false,
      completed: true,
      completedAtVersion: '7.2.4',
    };

    const store = useOnboardingStore();

    expect(store.isUpgrade).toBe(true);
    expect(store.shouldShowOnboarding).toBe(false);
  });
});

vi.mock('~/components/Onboarding/store/onboardingContextData', () => ({
  useOnboardingContextDataStore: vi.fn(),
}));

vi.mock('~/store/server', () => ({
  useServerStore: vi.fn(),
}));
