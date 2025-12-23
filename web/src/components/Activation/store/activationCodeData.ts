import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import {
  ACTIVATION_CODE_QUERY,
  PARTNER_INFO_QUERY,
} from '~/components/Activation/graphql/activationCode.query';
import {
  hasOverrideKey,
  isEnoKeyFile,
  useOnboardingTestOverrides,
} from '~/components/Activation/onboardingTestOverrides';
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

  const { overrides, enabled } = useOnboardingTestOverrides();

  const activationCode = computed(() => {
    if (enabled.value && hasOverrideKey(overrides.value, 'activationCode')) {
      return overrides.value?.activationCode ?? null;
    }
    return activationCodeResult.value?.customization?.activationCode;
  });

  const regState = computed(() => {
    if (enabled.value && hasOverrideKey(overrides.value, 'regState')) {
      return overrides.value?.regState ?? null;
    }
    return activationCodeResult.value?.vars?.regState ?? null;
  });

  const isFreshInstall = computed(() => {
    if (enabled.value && hasOverrideKey(overrides.value, 'regState')) {
      return isEnoKeyFile(overrides.value?.regState);
    }
    return activationCodeResult.value?.vars?.regState === RegistrationState.ENOKEYFILE;
  });

  /**
   * Public Partner Info becomes null when the user has set a password, so we fall back to the partnerInfo from the activation code
   */
  const partnerInfo = computed(() => {
    if (enabled.value && hasOverrideKey(overrides.value, 'partnerInfo')) {
      return overrides.value?.partnerInfo ?? null;
    }
    return (
      partnerInfoResult.value?.publicPartnerInfo ??
      activationCodeResult.value?.customization?.partnerInfo
    );
  });
  return {
    loading: computed(() => activationCodeLoading.value || partnerInfoLoading.value),
    activationCode,
    regState,
    isFreshInstall,
    partnerInfo,
  };
});
