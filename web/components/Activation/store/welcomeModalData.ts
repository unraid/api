import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { PUBLIC_WELCOME_DATA_QUERY } from '~/components/Activation/graphql/activationCode.query';

// Uses the shared global Pinia instance
import '~/store/globalPinia';

export const useWelcomeModalDataStore = defineStore('welcomeModalData', () => {
  const { result: publicWelcomeDataResult, loading: publicWelcomeDataLoading } = useQuery(
    PUBLIC_WELCOME_DATA_QUERY,
    {},
    { errorPolicy: 'all' }
  );

  const partnerInfo = computed(
    () => publicWelcomeDataResult.value?.publicPartnerInfo
  );

  const isInitialSetup = computed(
    () => publicWelcomeDataResult.value?.isInitialSetup ?? false
  );

  return {
    loading: computed(() => publicWelcomeDataLoading.value),
    partnerInfo,
    isInitialSetup,
  };
});
