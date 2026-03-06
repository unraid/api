import { computed, ref } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { ONBOARDING_QUERY } from '@/components/Onboarding/graphql/activationOnboarding.query';
import coerce from 'semver/functions/coerce';
import gte from 'semver/functions/gte';

import type { OnboardingStatus } from '~/composables/gql/graphql';

import { useServerStore } from '~/store/server';

const MIN_ONBOARDING_VERSION = '7.3.0';
const ONBOARDING_TEST_UNAUTHENTICATED_STORAGE_KEY = 'onboardingAdminPanel.mockUnauthenticated';
const ONBOARDING_TEST_OS_VERSION_STORAGE_KEY = 'onboardingAdminPanel.mockOsVersion';

const isOnboardingAdminPanelContext = () => {
  if (typeof document === 'undefined') {
    return false;
  }
  return Boolean(
    document.querySelector('unraid-onboarding-admin-panel, unraid-onboarding-test-harness')
  );
};

const readMockUnauthenticatedFromStorage = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  if (!isOnboardingAdminPanelContext()) {
    localStorage.removeItem(ONBOARDING_TEST_UNAUTHENTICATED_STORAGE_KEY);
    return false;
  }
  return localStorage.getItem(ONBOARDING_TEST_UNAUTHENTICATED_STORAGE_KEY) === 'true';
};

const readMockOsVersionFromStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!isOnboardingAdminPanelContext()) {
    localStorage.removeItem(ONBOARDING_TEST_OS_VERSION_STORAGE_KEY);
    return null;
  }
  const persistedValue = localStorage.getItem(ONBOARDING_TEST_OS_VERSION_STORAGE_KEY);
  const trimmedValue = persistedValue?.trim();
  return trimmedValue ? trimmedValue : null;
};

const isVersionAtLeast = (version: string | null | undefined, minVersion: string): boolean => {
  const normalizedVersion = coerce(version);
  const normalizedMinVersion = coerce(minVersion);
  if (!normalizedVersion || !normalizedMinVersion) {
    return false;
  }

  return gte(normalizedVersion, normalizedMinVersion);
};

const isUnauthenticatedApolloError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const apolloError = error as {
    message?: string;
    graphQLErrors?: Array<{
      message?: string;
      extensions?: {
        code?: string;
        originalError?: { statusCode?: number; message?: string };
      };
    }>;
    networkError?: {
      statusCode?: number;
      message?: string;
    };
  };

  if (apolloError.networkError?.statusCode === 401) {
    return true;
  }

  const graphQLErrors = apolloError.graphQLErrors ?? [];
  if (
    graphQLErrors.some(
      (gqlError) =>
        gqlError?.extensions?.code === 'UNAUTHENTICATED' ||
        gqlError?.extensions?.originalError?.statusCode === 401
    )
  ) {
    return true;
  }

  const messageBlob = [
    apolloError.message,
    apolloError.networkError?.message,
    ...graphQLErrors.map((gqlError) => gqlError?.message),
    ...graphQLErrors.map((gqlError) => gqlError?.extensions?.originalError?.message),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    messageBlob.includes('unauthenticated') ||
    messageBlob.includes('unauthorized') ||
    messageBlob.includes('invalid csrf token')
  );
};

export const useOnboardingStore = defineStore('onboarding', () => {
  const { osVersion } = storeToRefs(useServerStore());
  const {
    result: onboardingResult,
    loading: onboardingLoading,
    error: onboardingError,
    refetch,
  } = useQuery(ONBOARDING_QUERY, {}, { errorPolicy: 'all' });

  const onboardingData = computed(() => onboardingResult.value?.customization?.onboarding);
  const mockUnauthenticated = ref(readMockUnauthenticatedFromStorage());
  const mockOsVersion = ref<string | null>(readMockOsVersionFromStorage());

  // Core state from API
  const status = computed<OnboardingStatus | undefined>(() => onboardingData.value?.status);
  const isPartnerBuild = computed(() => onboardingData.value?.isPartnerBuild ?? false);
  const completed = computed(() => onboardingData.value?.completed ?? false);
  const completedAtVersion = computed(() => onboardingData.value?.completedAtVersion);

  // Derived helpers for component logic
  const isUpgrade = computed(() => status.value === 'UPGRADE');
  const isDowngrade = computed(() => status.value === 'DOWNGRADE');
  const isVersionDrift = computed(() => status.value === 'UPGRADE' || status.value === 'DOWNGRADE');
  const isIncomplete = computed(() => status.value === 'INCOMPLETE');
  const isCompleted = computed(() => status.value === 'COMPLETED');
  const effectiveOsVersion = computed(() => mockOsVersion.value ?? osVersion.value);
  const isVersionSupported = computed(() =>
    isVersionAtLeast(effectiveOsVersion.value, MIN_ONBOARDING_VERSION)
  );
  const setMockUnauthenticated = (value: boolean) => {
    mockUnauthenticated.value = value;
    if (typeof window !== 'undefined' && isOnboardingAdminPanelContext()) {
      localStorage.setItem(ONBOARDING_TEST_UNAUTHENTICATED_STORAGE_KEY, value ? 'true' : 'false');
    }
  };
  const setMockOsVersion = (value: string | null) => {
    const normalizedValue = value?.trim() || null;
    mockOsVersion.value = normalizedValue;
    if (typeof window !== 'undefined' && isOnboardingAdminPanelContext()) {
      if (normalizedValue) {
        localStorage.setItem(ONBOARDING_TEST_OS_VERSION_STORAGE_KEY, normalizedValue);
      } else {
        localStorage.removeItem(ONBOARDING_TEST_OS_VERSION_STORAGE_KEY);
      }
    }
  };

  const isUnauthenticated = computed(
    () => mockUnauthenticated.value || isUnauthenticatedApolloError(onboardingError.value)
  );
  const canDisplayOnboardingModal = computed(() => isVersionSupported.value && !isUnauthenticated.value);

  // Decision: should we show the onboarding modal?
  const shouldShowOnboarding = computed(() => {
    if (!canDisplayOnboardingModal.value) {
      return false;
    }

    // Show onboarding if status is INCOMPLETE or UPGRADE
    return status.value === 'INCOMPLETE' || status.value === 'UPGRADE' || status.value === 'DOWNGRADE';
  });

  return {
    loading: computed(() => onboardingLoading.value),
    // Core state
    status,
    isPartnerBuild,
    completed,
    completedAtVersion,
    // Derived helpers
    isUpgrade,
    isDowngrade,
    isVersionDrift,
    isIncomplete,
    isCompleted,
    osVersion,
    effectiveOsVersion,
    isVersionSupported,
    mockUnauthenticated,
    mockOsVersion,
    isUnauthenticated,
    canDisplayOnboardingModal,
    shouldShowOnboarding,
    // Actions
    refetchOnboarding: refetch,
    setMockUnauthenticated,
    setMockOsVersion,
  };
});

// Keep the old name as an alias for backward compatibility during migration
export const useUpgradeOnboardingStore = useOnboardingStore;
