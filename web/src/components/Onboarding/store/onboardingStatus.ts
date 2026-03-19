import { computed, ref, unref } from 'vue';
import { defineStore } from 'pinia';

import coerce from 'semver/functions/coerce';
import gte from 'semver/functions/gte';

import type { OnboardingStatus } from '~/composables/gql/graphql';

import { useOnboardingContextDataStore } from '~/components/Onboarding/store/onboardingContextData';
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
  const serverStore = useServerStore();
  const onboardingContextStore = useOnboardingContextDataStore();
  const { refetchOnboardingContext } = onboardingContextStore;
  const osVersion = computed(() => unref(serverStore.osVersion));
  const onboardingData = computed(() => unref(onboardingContextStore.onboarding));
  const onboardingLoading = computed(() => unref(onboardingContextStore.loading));
  const onboardingError = computed(() => unref(onboardingContextStore.error));
  const mockOsVersion = ref<string | null>(readMockOsVersionFromStorage());

  // Core state from API
  const status = computed<OnboardingStatus | undefined>(() => onboardingData.value?.status);
  const isPartnerBuild = computed(() => onboardingData.value?.isPartnerBuild ?? false);
  const completed = computed(() => onboardingData.value?.completed ?? false);
  const completedAtVersion = computed(() => onboardingData.value?.completedAtVersion);
  const shouldOpen = computed(() => onboardingData.value?.shouldOpen ?? false);

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

  const hasOnboardingError = computed(() => Boolean(onboardingError.value));
  const canDisplayOnboardingModal = computed(() => !hasOnboardingError.value);

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
    shouldOpen,
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
    hasOnboardingError,
    canDisplayOnboardingModal,
    shouldShowOnboarding,
    // Actions
    refetchOnboarding: refetchOnboardingContext,
    setMockOsVersion,
  };
});
