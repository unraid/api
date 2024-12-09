import { defineStore, createPinia, setActivePinia } from 'pinia';
import { useServerStore } from '~/store/server';

setActivePinia(createPinia()); /** required in web component context */

export interface ActivationCodeData {
  code: string;
  partnerName?: string;
  partnerUrl?: string;
}

export const useActivationCodeStore = defineStore('activationCode', () => {
  const data = ref<ActivationCodeData | null>(null);

  const setData = (newData: ActivationCodeData) => {
    data.value = newData;
  };

  const code = computed<string | null>(() => data.value?.code || null);
  const partnerName = computed<string | null>(() => data.value?.partnerName || null);
  const partnerUrl = computed<string | null>(() => data.value?.partnerName || null);

  /**
   * Should only see this if fresh server install and no keyfile has been present before.
   */
  const showModal = computed<boolean>(() => {
    if (!data.value) {
      return false;
    }

    const { state } = storeToRefs(useServerStore());
    return state.value === 'ENOKEYFILE';
  });

  return {
    code,
    partnerName,
    partnerUrl,
    showModal,
    setData,
  };
});
