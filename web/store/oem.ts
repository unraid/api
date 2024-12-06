import { defineStore, createPinia, setActivePinia } from 'pinia';
import { useServerStore } from '~/store/server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export interface OemData {
  code: string;
  oemLogo_base64?: string;
  oemName: string;
  oemUrl?: string;
  colors?: {
    primary: string;
    secondary: string;
    three?: string;
    four?: string;
    five?: string;
  };
  banner_base64?: string;
}

export const useOemStore = defineStore('oem', () => {
  const data = ref<OemData | null>(null);

  const setData = (newData: OemData) => {
    data.value = newData;
  };

  const activationCode = computed<string | null>(() => data.value?.code || null);
  const oemName = computed<string | null>(() => data.value?.oemName || null);

  /**
   * Should only see this if fresh server install and no keyfile has been present before.
   */
  const showActivationModal = computed<boolean>(() => {
    if (!data.value) {
      return false;
    }

    const { state } = storeToRefs(useServerStore());
    return state.value === 'ENOKEYFILE';
  });

  return {
    activationCode,
    oemName,
    showActivationModal,
    setData,
  };
});
