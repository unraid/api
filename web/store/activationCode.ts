import { computed, ref, watch } from 'vue';
import { createPinia, defineStore, setActivePinia, storeToRefs } from 'pinia';

import { ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY } from '~/consts';

import { useCallbackActionsStore } from '~/store/callbackActions';
import { useServerStore } from '~/store/server';

setActivePinia(createPinia()); /** required in web component context */

export interface ActivationCodeData {
  background?: string;
  caseIcon?: string;
  code: string;
  comment?: string;
  header?: string;
  headermetacolor?: string;
  partnerLogo?: boolean;
  partnerName?: string;
  partnerUrl?: string;
  showBannerGradient?: 'yes';
  sysModel?: string;
  theme?: 'azure' | 'black' | 'gray' | 'white';
}

export const useActivationCodeStore = defineStore('activationCode', () => {
  const data = ref<ActivationCodeData | null>(null);

  const setData = (newData: ActivationCodeData) => {
    console.debug('[useActivationCodeStore] setData', newData);
    data.value = newData;
  };

  const code = computed<string | null>(() => data.value?.code || null);
  const partnerName = computed<string | null>(() => data.value?.partnerName || null);
  const partnerUrl = computed<string | null>(() => data.value?.partnerUrl || null);
  const partnerLogo = computed<string | null>(() =>
    data.value?.partnerLogo ? `/webGui/images/partner-logo.svg` : null
  );

  const activationModalHidden = ref<boolean>(
    sessionStorage.getItem(ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY) === 'true'
  );
  const setActivationModalHidden = (value: boolean) => (activationModalHidden.value = value);
  watch(activationModalHidden, (newVal) => {
    return newVal
      ? sessionStorage.setItem(ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY, 'true')
      : sessionStorage.removeItem(ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY);
  });
  /**
   * Should only see this if
   * 1. fresh server install where no keyfile has been present before
   * 2. there's not callback data
   * 3. we're not on the registration page
   * 4. it's not been manually hidden
   */
  const showActivationModal = computed<boolean>(() => {
    if (!data.value) {
      return false;
    }

    const { callbackData } = storeToRefs(useCallbackActionsStore());
    const { state } = storeToRefs(useServerStore());

    const isFreshInstall = state.value === 'ENOKEYFILE';
    const noCallbackData = !callbackData.value;

    return isFreshInstall && noCallbackData && !activationModalHidden.value;
  });

  return {
    code,
    partnerName,
    partnerUrl,
    partnerLogo,
    showActivationModal,
    setData,
    setActivationModalHidden,
  };
});
