import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ACTIVATION_CODE_QUERY,
  PARTNER_INFO_QUERY,
} from '~/components/Activation/graphql/activationCode.query';
import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
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

    it('should compute loading state when partnerInfoLoading is true', () => {
      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === PARTNER_INFO_QUERY) {
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
      const mockActivationCode = 'TEST-CODE-123';

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

      expect(store.activationCode).toBe(mockActivationCode);
    });

    it('should compute isFreshInstall as true when regState is ENOKEYFILE', () => {
      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === ACTIVATION_CODE_QUERY) {
          return createCompleteQueryMock(
            {
              vars: { regState: RegistrationState.ENOKEYFILE },
            },
            false
          );
        }

        return createCompleteQueryMock(null, false);
      });

      const store = useActivationCodeDataStore();

      expect(store.isFreshInstall).toBe(true);
    });

    it('should compute isFreshInstall as false when regState is not ENOKEYFILE', () => {
      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === ACTIVATION_CODE_QUERY) {
          return createCompleteQueryMock(
            {
              vars: { regState: 'REGISTERED' as RegistrationState },
            },
            false
          );
        }

        return createCompleteQueryMock(null, false);
      });

      const store = useActivationCodeDataStore();

      expect(store.isFreshInstall).toBe(false);
    });

    it('should use publicPartnerInfo when available', () => {
      const mockPublicPartnerInfo = { name: 'Public Partner' };
      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === PARTNER_INFO_QUERY) {
          return createCompleteQueryMock(
            {
              publicPartnerInfo: mockPublicPartnerInfo,
            },
            false
          );
        }

        return createCompleteQueryMock(null, false);
      });

      const store = useActivationCodeDataStore();

      expect(store.partnerInfo).toEqual(mockPublicPartnerInfo);
    });

    it('should fallback to activationCode partnerInfo when publicPartnerInfo is null', () => {
      const mockPartnerInfo = { name: 'Activation Partner' };
      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === ACTIVATION_CODE_QUERY) {
          return createCompleteQueryMock(
            {
              customization: { partnerInfo: mockPartnerInfo },
            },
            false
          );
        } else if (query === PARTNER_INFO_QUERY) {
          return createCompleteQueryMock(
            {
              publicPartnerInfo: null,
            },
            false
          );
        }

        return createCompleteQueryMock(null, false);
      });

      const store = useActivationCodeDataStore();

      expect(store.partnerInfo).toEqual(mockPartnerInfo);
    });
  });
});
