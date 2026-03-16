import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { ONBOARDING_BOOTSTRAP_QUERY } from '~/components/Onboarding/graphql/onboardingBootstrap.query';

export const useOnboardingContextDataStore = defineStore('onboardingContextData', () => {
  const {
    result: onboardingBootstrapResult,
    loading: onboardingBootstrapLoading,
    error: onboardingBootstrapError,
    refetch,
  } = useQuery(ONBOARDING_BOOTSTRAP_QUERY, {}, { errorPolicy: 'all', fetchPolicy: 'cache-and-network' });

  const onboarding = computed(() => onboardingBootstrapResult.value?.customization?.onboarding ?? null);
  const onboardingState = computed(() => onboarding.value?.onboardingState ?? null);
  const activationCode = computed(
    () => onboardingBootstrapResult.value?.customization?.activationCode ?? null
  );
  const internalBootVisibility = computed(() => onboardingBootstrapResult.value?.vars ?? null);

  return {
    loading: computed(() => onboardingBootstrapLoading.value),
    error: computed(() => onboardingBootstrapError.value),
    onboarding,
    onboardingState,
    activationCode,
    internalBootVisibility,
    refetchOnboardingContext: refetch,
  };
});
