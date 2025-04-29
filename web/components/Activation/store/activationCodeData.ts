import { computed } from 'vue';
import { createPinia, defineStore, setActivePinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import {
  ACTIVATION_CODE_QUERY,
  PARTNER_INFO_QUERY,
} from '~/components/Activation/graphql/activationCode.query';
import { RegistrationState } from '~/composables/gql/graphql';

setActivePinia(createPinia()); /** required in web component context */

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

  const activationCode = computed(() => activationCodeResult.value?.customization?.activationCode);
  const isFreshInstall = computed(
    () => activationCodeResult.value?.vars?.regState === RegistrationState.ENOKEYFILE
  );

  /**
   * Public Partner Info becomes null when the user has set a password, so we fall back to the partnerInfo from the activation code
   */
  const partnerInfo = computed(
    () =>
      partnerInfoResult.value?.publicPartnerInfo ??
      activationCodeResult.value?.customization?.partnerInfo
  );
  return {
    loading: computed(() => activationCodeLoading.value || partnerInfoLoading.value),
    activationCode,
    isFreshInstall,
    partnerInfo,
  };
});
