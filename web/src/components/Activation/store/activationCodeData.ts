import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import {
  ACTIVATION_CODE_QUERY,
  PARTNER_INFO_QUERY,
} from '~/components/Activation/graphql/activationCode.query';
import { RegistrationState } from '~/composables/gql/graphql';

export const useActivationCodeDataStore = defineStore('activationCodeData', () => {
  const { result: activationCodeResult, loading: activationCodeLoading } = useQuery(
    ACTIVATION_CODE_QUERY,
    {},
    { errorPolicy: 'all' }
  );
  const { result: partnerInfoResult, loading: partnerInfoLoading } = useQuery(
    PARTNER_INFO_QUERY,
    {},
    { errorPolicy: 'all' }
  );

  const onboardingState = computed(() => activationCodeResult.value?.customization?.onboardingState);

  const activationCode = computed(() => activationCodeResult.value?.customization?.activationCode);

  const registrationState = computed(() => onboardingState.value?.registrationState ?? null);

  const isFreshInstall = computed(() => {
    if (onboardingState.value?.isFreshInstall != null) {
      return onboardingState.value.isFreshInstall;
    }
    return registrationState.value === RegistrationState.ENOKEYFILE;
  });

  /**
   * Public Partner Info becomes null when the user has set a password, so we fall back to the partnerInfo from the activation code
   */
  const partnerInfo = computed(() => {
    return (
      partnerInfoResult.value?.publicPartnerInfo ??
      activationCodeResult.value?.customization?.partnerInfo
    );
  });

  const activationRequired = computed(() => onboardingState.value?.activationRequired ?? false);

  const hasActivationCode = computed(() => {
    if (onboardingState.value?.hasActivationCode != null) {
      return onboardingState.value.hasActivationCode;
    }
    return Boolean(activationCode.value?.code);
  });

  const isRegistered = computed(() => onboardingState.value?.isRegistered ?? false);

  const isInitialSetup = computed(() => onboardingState.value?.isInitialSetup ?? false);
  return {
    loading: computed(() => activationCodeLoading.value || partnerInfoLoading.value),
    activationCode,
    registrationState,
    isFreshInstall,
    partnerInfo,
    activationRequired,
    hasActivationCode,
    isRegistered,
    isInitialSetup,
  };
});
