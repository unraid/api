import { defineStore, createPinia, setActivePinia } from 'pinia';
import { useServerStore } from '~/store/server';
import { useCallbackActionsStore } from '~/store/callbackActions';

setActivePinia(createPinia()); /** required in web component context */

export interface ActivationCodeData {
  code: string;
  partnerName?: string;
  partnerUrl?: string;
}

export const useActivationCodeStore = defineStore('activationCode', () => {
  const data = ref<ActivationCodeData | null>(null);

  const setData = (newData: ActivationCodeData) => {
    console.debug('[useActivationCodeStore] setData', newData);
    data.value = newData;
  };

  const code = computed<string | null>(() => data.value?.code || null);
  const partnerName = computed<string | null>(() => data.value?.partnerName || null);
  const partnerUrl = computed<string | null>(() => data.value?.partnerName || null);

  const sessionKey = 'activationCodeModalHidden';
  const modalHidden = ref<boolean>(sessionStorage.getItem(sessionKey) === 'true');
  const setModalHidden = (value: boolean) => modalHidden.value = value;
  watch(modalHidden, (newVal) => {
    return newVal ? sessionStorage.setItem(sessionKey, 'true') : sessionStorage.removeItem(sessionKey);
  });
  /**
   * Should only see this if
   * 1. fresh server install where no keyfile has been present before
   * 2. there's not callback data
   * 3. we're not on the registration page
   * 4. it's not been manually hidden
   */
  const showModal = computed<boolean>(() => {
    if (!data.value) {
      return false;
    }

    const { callbackData } = storeToRefs(useCallbackActionsStore());
    const { state } = storeToRefs(useServerStore());

    const isFreshInstall = state.value === 'ENOKEYFILE';
    const noCallbackData = !callbackData.value;
    console.debug('[useActivationCodeStore] showModal', { isFreshInstall, noCallbackData });

    return isFreshInstall && noCallbackData && !modalHidden.value;
  });

  return {
    code,
    partnerName,
    partnerUrl,
    showModal,
    setData,
    setModalHidden,
  };
});
