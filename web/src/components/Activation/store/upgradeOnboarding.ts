import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import { useSessionStorage } from '@vueuse/core';

import type { ActivationOnboardingQuery } from '~/composables/gql/graphql';

import { ACTIVATION_ONBOARDING_QUERY } from '~/components/Activation/activationOnboarding.query';

const UPGRADE_ONBOARDING_HIDDEN_KEY = 'upgrade-onboarding-hidden';

export const useUpgradeOnboardingStore = defineStore('upgradeOnboarding', () => {
  const {
    result: activationOnboardingResult,
    loading: activationOnboardingLoading,
    refetch,
  } = useQuery(ACTIVATION_ONBOARDING_QUERY, {}, { errorPolicy: 'all' });

  const isHidden = useSessionStorage<boolean>(UPGRADE_ONBOARDING_HIDDEN_KEY, false);

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
    return !isHidden.value && (onboardingData.value?.hasPendingSteps ?? false);
  });

  const setIsHidden = (value: boolean) => {
    isHidden.value = value;
  };

  return {
    loading: computed(() => activationOnboardingLoading.value),
    isUpgrade,
    previousVersion,
    currentVersion,
    completedSteps,
    allUpgradeSteps,
    upgradeSteps,
    shouldShowUpgradeOnboarding,
    isHidden,
    setIsHidden,
    refetchActivationOnboarding: refetch,
  };
});
