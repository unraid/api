import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { ACTIVATION_ONBOARDING_QUERY } from '~/components/Activation/activationOnboarding.query';

export const useUpgradeOnboardingStore = defineStore('upgradeOnboarding', () => {
  const {
    result: activationOnboardingResult,
    loading: activationOnboardingLoading,
    refetch,
  } = useQuery(ACTIVATION_ONBOARDING_QUERY, {}, { errorPolicy: 'all' });

  const onboardingData = computed(() => activationOnboardingResult.value?.activationOnboarding);

  const isUpgrade = computed(() => onboardingData.value?.isUpgrade ?? false);
  const previousVersion = computed(() => onboardingData.value?.previousVersion);
  const currentVersion = computed(() => onboardingData.value?.currentVersion);

  // New simplified API: check 'completed' boolean
  const isCompleted = computed(() => onboardingData.value?.completed ?? false);

  const shouldShowUpgradeOnboarding = computed(() => {
    // If we are an upgrade and NOT completed, show the wizard
    return isUpgrade.value && !isCompleted.value;
  });

  return {
    loading: computed(() => activationOnboardingLoading.value),
    isUpgrade,
    previousVersion,
    currentVersion,
    isCompleted,
    shouldShowUpgradeOnboarding,
    refetchActivationOnboarding: refetch,
  };
});
