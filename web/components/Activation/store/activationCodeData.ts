import { createPinia, defineStore, setActivePinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { ACTIVATION_CODE_QUERY } from '~/components/Activation/graphql/activationcode.query';
import { RegistrationState } from '~/composables/gql/graphql';

setActivePinia(createPinia()); /** required in web component context */

export const useActivationCodeDataStore = defineStore('activationCodeData', () => {
  const { result } = useQuery(ACTIVATION_CODE_QUERY);

  const activationCode = computed(() => result.value?.customization?.activationCode);
  const isFreshInstall = computed(() => result.value?.vars?.regState === RegistrationState.ENOKEYFILE);
  return {
    activationCode,
    isFreshInstall,
    
  };
});
