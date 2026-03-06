import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { ACTIVATION_CODE_QUERY } from '~/components/Onboarding/graphql/activationCode.query';

export const useActivationCodeDataStore = defineStore('activationCodeData', () => {
  const { result: activationCodeResult, loading: activationCodeLoading } = useQuery(
    ACTIVATION_CODE_QUERY,
    {},
    { errorPolicy: 'all' }
  );

  const onboardingState = computed(
    () => activationCodeResult.value?.customization?.onboarding?.onboardingState
  );

  const activationCode = computed(() => activationCodeResult.value?.customization?.activationCode);

  const registrationState = computed(() => onboardingState.value?.registrationState ?? null);

  const isFreshInstall = computed(() => onboardingState.value?.isFreshInstall ?? false);

  const partnerInfo = computed(() => {
    const activationCode = activationCodeResult.value?.customization?.activationCode;
    if (!activationCode?.partner && !activationCode?.branding) {
      return null;
    }
    return {
      partner: activationCode?.partner ?? null,
      branding: activationCode?.branding ?? null,
    };
  });

  const activationRequired = computed(() => onboardingState.value?.activationRequired ?? false);

  const hasActivationCode = computed(() => onboardingState.value?.hasActivationCode ?? false);

  const isRegistered = computed(() => onboardingState.value?.isRegistered ?? false);

  return {
    loading: computed(() => activationCodeLoading.value),
    activationCode,
    registrationState,
    isFreshInstall,
    partnerInfo,
    activationRequired,
    hasActivationCode,
    isRegistered,
  };
});
