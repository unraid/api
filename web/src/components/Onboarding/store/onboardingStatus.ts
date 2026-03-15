import { computed, ref } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { ONBOARDING_QUERY } from '@/components/Onboarding/graphql/activationOnboarding.query';
import coerce from 'semver/functions/coerce';
import gte from 'semver/functions/gte';

import type { OnboardingStatus } from '~/composables/gql/graphql';

import { useOnboardingDraftStore } from '~/components/Onboarding/store/onboardingDraft';
import { useServerStore } from '~/store/server';

const MIN_ONBOARDING_VERSION = '7.3.0';
const ONBOARDING_TEST_OS_VERSION_STORAGE_KEY = 'onboardingAdminPanel.mockOsVersion';

const isOnboardingAdminPanelContext = () => {
  if (typeof document === 'undefined') {
    return false;
  }
  return Boolean(
    document.querySelector('unraid-onboarding-admin-panel, unraid-onboarding-test-harness')
  );
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

export const useOnboardingStore = defineStore('onboarding', () => {
  const { osVersion } = storeToRefs(useServerStore());
  const { hasResumableDraft } = storeToRefs(useOnboardingDraftStore());
  const {
    result: onboardingResult,
    loading: onboardingLoading,
    error: onboardingError,
    refetch,
  } = useQuery(ONBOARDING_QUERY, {}, { errorPolicy: 'all' });

  const onboardingData = computed(() => onboardingResult.value?.customization?.onboarding);
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

  const hasOnboardingQueryError = computed(() => Boolean(onboardingError.value));
  const canDisplayOnboardingModal = computed(
    () => isVersionSupported.value && (hasResumableDraft.value || !hasOnboardingQueryError.value)
  );

  // Automatic onboarding should only run for initial setup.
  const shouldShowOnboarding = computed(() => {
    if (!canDisplayOnboardingModal.value) {
      return false;
    }

    return status.value === 'INCOMPLETE';
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
    mockOsVersion,
    hasOnboardingQueryError,
    canDisplayOnboardingModal,
    shouldShowOnboarding,
    // Actions
    refetchOnboarding: refetch,
    setMockOsVersion,
  };
});
