import { computed, unref } from 'vue';
import { defineStore } from 'pinia';

import { useOnboardingContextDataStore } from '~/components/Onboarding/store/onboardingContextData';

export const useActivationCodeDataStore = defineStore('activationCodeData', () => {
  const onboardingContextStore = useOnboardingContextDataStore();

  const loading = computed(() => unref(onboardingContextStore.loading));
  const onboardingState = computed(() => unref(onboardingContextStore.onboardingState));
  const activationCode = computed(() => unref(onboardingContextStore.activationCode));

  const registrationState = computed(() => onboardingState.value?.registrationState ?? null);

  const isFreshInstall = computed(() => onboardingState.value?.isFreshInstall ?? false);

  const partnerInfo = computed(() => {
    const activationCodeValue = activationCode.value;
    if (!activationCodeValue?.partner && !activationCodeValue?.branding) {
      return null;
    }
    return {
      partner: activationCodeValue?.partner ?? null,
      branding: activationCodeValue?.branding ?? null,
    };
  });

  const activationRequired = computed(() => onboardingState.value?.activationRequired ?? false);

  const hasActivationCode = computed(() => onboardingState.value?.hasActivationCode ?? false);

  const isRegistered = computed(() => onboardingState.value?.isRegistered ?? false);

  return {
    loading,
    activationCode,
    registrationState,
    isFreshInstall,
    partnerInfo,
    activationRequired,
    hasActivationCode,
    isRegistered,
  };
});
