import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { ONBOARDING_QUERY } from '@/components/Onboarding/graphql/activationOnboarding.query';

import type { OnboardingStatus } from '~/composables/gql/graphql';

export const useOnboardingStore = defineStore('onboarding', () => {
  const {
    result: onboardingResult,
    loading: onboardingLoading,
    refetch,
  } = useQuery(ONBOARDING_QUERY, {}, { errorPolicy: 'all' });

  const onboardingData = computed(() => onboardingResult.value?.onboarding);

  // Core state from API
  const status = computed<OnboardingStatus | undefined>(() => onboardingData.value?.status);
  const isPartnerBuild = computed(() => onboardingData.value?.isPartnerBuild ?? false);
  const completed = computed(() => onboardingData.value?.completed ?? false);
  const completedAtVersion = computed(() => onboardingData.value?.completedAtVersion);

  // Derived helpers for component logic
  const isUpgrade = computed(() => status.value === 'UPGRADE');
  const isIncomplete = computed(() => status.value === 'INCOMPLETE');
  const isCompleted = computed(() => status.value === 'COMPLETED');

  // Decision: should we show the onboarding modal?
  const shouldShowOnboarding = computed(() => {
    // Show onboarding if status is INCOMPLETE or UPGRADE
    return status.value === 'INCOMPLETE' || status.value === 'UPGRADE';
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
    isIncomplete,
    isCompleted,
    shouldShowOnboarding,
    // Actions
    refetchOnboarding: refetch,
  };
});

// Keep the old name as an alias for backward compatibility during migration
export const useUpgradeOnboardingStore = useOnboardingStore;
