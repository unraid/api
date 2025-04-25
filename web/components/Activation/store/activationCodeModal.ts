import { computed } from 'vue';
import { createPinia, defineStore, setActivePinia, storeToRefs } from 'pinia';
import { useSessionStorage } from '@vueuse/core';

import { ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY } from '~/consts';

import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useCallbackActionsStore } from '~/store/callbackActions';

setActivePinia(createPinia()); /** required in web component context */

export const useActivationCodeModalStore = defineStore('activationCodeModal', () => {
  const activationModalHidden = useSessionStorage<boolean>(
    ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY,
    false
  );

  const { isFreshInstall } = storeToRefs(useActivationCodeDataStore());
  const { callbackData } = storeToRefs(useCallbackActionsStore());

  const setActivationModalHidden = (value: boolean) => (activationModalHidden.value = value);

  /**
   * Should only see this if
   * 1. fresh server install where no keyfile has been present before
   * 2. there's not callback data
   * 3. we're not on the registration page
   * 4. it's not been manually hidden
   */
  const showActivationModal = computed<boolean>(() => {
    return isFreshInstall.value && !callbackData.value && !activationModalHidden.value;
  });

  /**
   * Listen for konami code sequence to close the modal
   */
  const keySequence = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
  ];
  let sequenceIndex = 0;

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === keySequence[sequenceIndex]) {
      sequenceIndex++;
    } else {
      sequenceIndex = 0;
    }

    if (sequenceIndex === keySequence.length) {
      setActivationModalHidden(true);
      window.location.href = '/Tools/Registration';
    }
  };

  onMounted(() => {
    window?.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    window?.removeEventListener('keydown', handleKeydown);
  });

  return {
    showActivationModal,
    setActivationModalHidden,
  };
});
