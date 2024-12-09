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

  /**
   * Should only see this if fresh server install where no keyfile has been present before AND there's not callback data.
   */
  const showModal = computed<boolean>(() => {
    if (!data.value) {
      return false;
    }

    const { callbackData } = storeToRefs(useCallbackActionsStore());
    const { state } = storeToRefs(useServerStore());

    return state.value === 'ENOKEYFILE' && !callbackData.value;
  });

  return {
    code,
    partnerName,
    partnerUrl,
    showModal,
    setData,
  };
});
