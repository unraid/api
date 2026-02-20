import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTIVATION_CODE_QUERY } from '~/components/Onboarding/graphql/activationCode.query';
import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { RegistrationState } from '~/composables/gql/graphql';

// Create a complete mock of UseQueryReturn with all required properties
const createCompleteQueryMock = <T>(result: T | null = null, loading = false) => ({
  result: ref(result),
  loading: ref(loading),
  error: ref(null),
  networkStatus: ref(7),
  called: ref(true),
  variables: ref({}),
  document: ref(null),
  query: ref(null),
  forceDisabled: ref(false),
  options: { errorPolicy: 'all' as const },
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

describe('ActivationCodeData Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Computed Properties', () => {
    it('should compute loading state when activationCodeLoading is true', () => {
      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === ACTIVATION_CODE_QUERY) {
          return createCompleteQueryMock(null, true);
        }

        return createCompleteQueryMock(null, false);
      });

      const store = useActivationCodeDataStore();

      expect(store.loading).toBe(true);
    });

    it('should compute loading state when both loadings are false', () => {
      vi.mocked(useQuery).mockImplementation(() => createCompleteQueryMock(null, false));

      const store = useActivationCodeDataStore();

      expect(store.loading).toBe(false);
    });

    it('should compute activationCode correctly', () => {
      const mockActivationCode = { code: 'TEST-CODE-123' };

      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === ACTIVATION_CODE_QUERY) {
          return createCompleteQueryMock(
            {
              customization: { activationCode: mockActivationCode },
            },
            false
          );
        }
        return createCompleteQueryMock(null, false);
      });

      const store = useActivationCodeDataStore();

      expect(store.activationCode).toEqual(mockActivationCode);
    });

    it('should compute isFreshInstall from backend when regState is ENOKEYFILE', () => {
      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === ACTIVATION_CODE_QUERY) {
          return createCompleteQueryMock(
            {
              customization: {
                onboarding: {
                  onboardingState: {
                    registrationState: RegistrationState.ENOKEYFILE,
                    isFreshInstall: true, // Backend determines this value
                  },
                },
              },
            },
            false
          );
        }

        return createCompleteQueryMock(null, false);
      });

      const store = useActivationCodeDataStore();

      expect(store.isFreshInstall).toBe(true);
    });

    it('should compute isFreshInstall from backend when regState is ENOKEYFILE1', () => {
      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === ACTIVATION_CODE_QUERY) {
          return createCompleteQueryMock(
            {
              customization: {
                onboarding: {
                  onboardingState: {
                    registrationState: RegistrationState.ENOKEYFILE1,
                    isFreshInstall: false, // Backend determines this value
                  },
                },
              },
            },
            false
          );
        }

        return createCompleteQueryMock(null, false);
      });

      const store = useActivationCodeDataStore();

      expect(store.isFreshInstall).toBe(false);
    });

    it('should compute isFreshInstall from backend when regState is ENOKEYFILE2', () => {
      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === ACTIVATION_CODE_QUERY) {
          return createCompleteQueryMock(
            {
              customization: {
                onboarding: {
                  onboardingState: {
                    registrationState: RegistrationState.ENOKEYFILE2,
                    isFreshInstall: false, // Backend determines this value
                  },
                },
              },
            },
            false
          );
        }

        return createCompleteQueryMock(null, false);
      });

      const store = useActivationCodeDataStore();

      expect(store.isFreshInstall).toBe(false);
    });

    it('should compute isFreshInstall from backend when regState is not ENOKEYFILE', () => {
      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === ACTIVATION_CODE_QUERY) {
          return createCompleteQueryMock(
            {
              customization: {
                onboarding: {
                  onboardingState: {
                    registrationState: RegistrationState.PRO,
                    isFreshInstall: false, // Backend determines this value
                  },
                },
              },
            },
            false
          );
        }

        return createCompleteQueryMock(null, false);
      });

      const store = useActivationCodeDataStore();

      expect(store.isFreshInstall).toBe(false);
    });

    it('should return false for isFreshInstall when onboardingState is null (query not loaded)', () => {
      vi.mocked(useQuery).mockImplementation(() => createCompleteQueryMock(null, false));

      const store = useActivationCodeDataStore();

      expect(store.isFreshInstall).toBe(false);
    });

    it('should derive partnerInfo from activationCode partner and branding', () => {
      const mockPartner = { name: 'Activation Partner' };
      const mockBranding = { hasPartnerLogo: true };
      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === ACTIVATION_CODE_QUERY) {
          return createCompleteQueryMock(
            {
              customization: {
                activationCode: {
                  partner: mockPartner,
                  branding: mockBranding,
                },
              },
            },
            false
          );
        }

        return createCompleteQueryMock(null, false);
      });

      const store = useActivationCodeDataStore();

      expect(store.partnerInfo).toEqual({
        partner: mockPartner,
        branding: mockBranding,
      });
    });

    it('should return null for partnerInfo when activationCode has no partner or branding', () => {
      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === ACTIVATION_CODE_QUERY) {
          return createCompleteQueryMock(
            {
              customization: { activationCode: null },
            },
            false
          );
        }

        return createCompleteQueryMock(null, false);
      });

      const store = useActivationCodeDataStore();

      expect(store.partnerInfo).toBeNull();
    });
  });
});
