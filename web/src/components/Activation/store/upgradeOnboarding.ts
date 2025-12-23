import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import type { ActivationOnboardingQuery } from '~/composables/gql/graphql';

import { ACTIVATION_ONBOARDING_QUERY } from '~/components/Activation/activationOnboarding.query';

export const useUpgradeOnboardingStore = defineStore('upgradeOnboarding', () => {
  const {
    result: activationOnboardingResult,
    loading: activationOnboardingLoading,
    refetch,
  } = useQuery(ACTIVATION_ONBOARDING_QUERY, {}, { errorPolicy: 'all' });

  const onboardingData = computed<ActivationOnboardingQuery['activationOnboarding'] | undefined>(
    () => activationOnboardingResult.value?.activationOnboarding
  );

  const isUpgrade = computed(() => onboardingData.value?.isUpgrade ?? false);
  const previousVersion = computed(() => onboardingData.value?.previousVersion);
  const currentVersion = computed(() => onboardingData.value?.currentVersion);

  const allUpgradeSteps = computed(
    () =>
      onboardingData.value?.steps ?? ([] as ActivationOnboardingQuery['activationOnboarding']['steps'])
  );

  const upgradeSteps = computed(() => allUpgradeSteps.value.filter((step) => !step.completed));

  const completedSteps = computed(() =>
    allUpgradeSteps.value.filter((step) => step.completed).map((step) => step.id)
  );

  const shouldShowUpgradeOnboarding = computed(() => {
    return onboardingData.value?.hasPendingSteps ?? false;
  });

  return {
    loading: computed(() => activationOnboardingLoading.value),
    isUpgrade,
    previousVersion,
    currentVersion,
    completedSteps,
    allUpgradeSteps,
    upgradeSteps,
    shouldShowUpgradeOnboarding,
    refetchActivationOnboarding: refetch,
  };
});
