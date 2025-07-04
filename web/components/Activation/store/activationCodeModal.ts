import { computed, onMounted, onUnmounted } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { useSessionStorage } from '@vueuse/core';

import { ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY } from '~/consts';

import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useCallbackActionsStore } from '~/store/callbackActions';

// Uses the shared global Pinia instance
import '~/store/globalPinia';

export const useActivationCodeModalStore = defineStore('activationCodeModal', () => {
  const isHidden = useSessionStorage<boolean | null>(ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY, null);

  const { isFreshInstall } = storeToRefs(useActivationCodeDataStore());
  const { callbackData } = storeToRefs(useCallbackActionsStore());

  const setIsHidden = (value: boolean | null) => {
    isHidden.value = value;
  };

  /**
   * Should only see this if
   * 1. It's explicitly set to show (isHidden === false)
   * OR
   * 2. It's a fresh server install where no keyfile has been present before
   * 3. there's not callback data
   * 4. it's not been explicitly hidden (isHidden === null)
   */
  const isVisible = computed<boolean>(() => {
    // Force show if explicitly set to false
    if (isHidden.value === false) {
      return true;
    }
    // Default visibility logic (show if not explicitly hidden AND fresh install AND no callback data)
    return isHidden.value === null && isFreshInstall.value && !callbackData.value;
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
      setIsHidden(true);
      // Redirect only if explicitly hidden via konami code, not just closed normally
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
    isVisible,
    setIsHidden,
  };
});
