import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Ref } from 'vue';

import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useOnboardingContextDataStore } from '~/components/Onboarding/store/onboardingContextData';
import { RegistrationState } from '~/composables/gql/graphql';

type OnboardingState = {
  registrationState?: RegistrationState | null;
  isRegistered?: boolean;
  isFreshInstall?: boolean;
  hasActivationCode?: boolean;
  activationRequired?: boolean;
} | null;

type ActivationCode = {
  code?: string | null;
  partner?: { name?: string | null } | null;
  branding?: { hasPartnerLogo?: boolean | null } | null;
} | null;

const { state } = vi.hoisted(() => ({
  state: {
    loading: null as unknown as Ref<boolean>,
    onboardingState: null as unknown as Ref<OnboardingState>,
    activationCode: null as unknown as Ref<ActivationCode>,
  },
}));

describe('ActivationCodeData Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    state.loading = ref(false);
    state.onboardingState = ref(null);
    state.activationCode = ref(null);

    vi.mocked(useOnboardingContextDataStore).mockReturnValue({
      loading: state.loading,
      onboardingState: state.onboardingState,
      activationCode: state.activationCode,
    } as unknown as ReturnType<typeof useOnboardingContextDataStore>);
  });

  it('exposes loading from the shared onboarding context store', () => {
    state.loading.value = true;

    const store = useActivationCodeDataStore();

    expect(store.loading).toBe(true);
  });

  it('returns activation code data from the shared onboarding context store', () => {
    state.activationCode.value = { code: 'TEST-CODE-123' };

    const store = useActivationCodeDataStore();

    expect(store.activationCode).toEqual({ code: 'TEST-CODE-123' });
  });

  it('computes registration state flags from onboarding state', () => {
    state.onboardingState.value = {
      registrationState: RegistrationState.ENOKEYFILE,
      isRegistered: false,
      isFreshInstall: true,
      hasActivationCode: true,
      activationRequired: true,
    };

    const store = useActivationCodeDataStore();

    expect(store.registrationState).toBe(RegistrationState.ENOKEYFILE);
    expect(store.isRegistered).toBe(false);
    expect(store.isFreshInstall).toBe(true);
    expect(store.hasActivationCode).toBe(true);
    expect(store.activationRequired).toBe(true);
  });

  it('returns safe defaults when onboarding state is unavailable', () => {
    const store = useActivationCodeDataStore();

    expect(store.registrationState).toBeNull();
    expect(store.isRegistered).toBe(false);
    expect(store.isFreshInstall).toBe(false);
    expect(store.hasActivationCode).toBe(false);
    expect(store.activationRequired).toBe(false);
  });

  it('derives partnerInfo from activation code partner and branding', () => {
    state.activationCode.value = {
      partner: { name: 'Activation Partner' },
      branding: { hasPartnerLogo: true },
    };

    const store = useActivationCodeDataStore();

    expect(store.partnerInfo).toEqual({
      partner: { name: 'Activation Partner' },
      branding: { hasPartnerLogo: true },
    });
  });

  it('returns null partnerInfo when activation code has no partner or branding', () => {
    state.activationCode.value = null;

    const store = useActivationCodeDataStore();

    expect(store.partnerInfo).toBeNull();
  });
});

vi.mock('~/components/Onboarding/store/onboardingContextData', () => ({
  useOnboardingContextDataStore: vi.fn(),
}));
