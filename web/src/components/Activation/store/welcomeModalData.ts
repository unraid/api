import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { PUBLIC_WELCOME_DATA_QUERY } from '~/components/Activation/graphql/activationCode.query';
import {
  hasOverrideKey,
  useOnboardingTestOverrides,
} from '~/components/Activation/onboardingTestOverrides';

// Uses the shared global Pinia instance

export const useWelcomeModalDataStore = defineStore('welcomeModalData', () => {
  const { result: publicWelcomeDataResult, loading: publicWelcomeDataLoading } = useQuery(
    PUBLIC_WELCOME_DATA_QUERY,
    {},
    { errorPolicy: 'all' }
  );

  const { overrides, enabled } = useOnboardingTestOverrides();

  const partnerInfo = computed(() => {
    if (enabled.value && hasOverrideKey(overrides.value, 'partnerInfo')) {
      return overrides.value?.partnerInfo ?? null;
    }
    return publicWelcomeDataResult.value?.publicPartnerInfo;
  });

  const isInitialSetup = computed(() => {
    if (enabled.value && hasOverrideKey(overrides.value, 'isInitialSetup')) {
      return overrides.value?.isInitialSetup ?? false;
    }
    return publicWelcomeDataResult.value?.isInitialSetup ?? false;
  });

  return {
    loading: computed(() => publicWelcomeDataLoading.value),
    partnerInfo,
    isInitialSetup,
  };
});
