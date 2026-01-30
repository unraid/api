import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { PUBLIC_WELCOME_DATA_QUERY } from '~/components/Onboarding/graphql/activationCode.query';

// Uses the shared global Pinia instance

export const useWelcomeModalDataStore = defineStore('welcomeModalData', () => {
  const { result: publicWelcomeDataResult, loading: publicWelcomeDataLoading } = useQuery(
    PUBLIC_WELCOME_DATA_QUERY,
    {},
    { errorPolicy: 'all' }
  );

  const partnerInfo = computed(() => {
    return publicWelcomeDataResult.value?.publicPartnerInfo;
  });

  const isFreshInstall = computed(() => {
    return publicWelcomeDataResult.value?.isFreshInstall ?? false;
  });

  return {
    loading: computed(() => publicWelcomeDataLoading.value),
    partnerInfo,
    isFreshInstall,
  };
});
