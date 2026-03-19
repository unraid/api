import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { useSessionStorage } from '@vueuse/core';

import { ONBOARDING_TEMP_BYPASS_STORAGE_KEY } from '~/components/Onboarding/constants';
import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useOnboardingStore } from '~/components/Onboarding/store/onboardingStatus';
import {
  clearLegacyOnboardingModalHiddenSessionState,
  clearOnboardingDraftStorage,
} from '~/components/Onboarding/store/onboardingStorageCleanup';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useServerStore } from '~/store/server';

const ONBOARDING_QUERY_ACTION_PARAM = 'onboarding';
const ONBOARDING_URL_ACTION_BYPASS = 'bypass';
const ONBOARDING_URL_ACTION_RESUME = 'resume';
const ONBOARDING_URL_ACTION_OPEN = 'open';
const ONBOARDING_BYPASS_SHORTCUT_CODE = 'KeyO';
const ONBOARDING_FORCE_OPEN_EVENT = 'unraid:onboarding:open';
const SECONDS_PER_MINUTE = 60;

type TemporaryBypassState = {
  active: boolean;
  bootMarker: number | null;
};

export const useOnboardingModalStore = defineStore('onboardingModalVisibility', () => {
  const isHidden = ref<boolean | null>(null);
  const isForceOpened = ref(false);
  const temporaryBypassState = useSessionStorage<TemporaryBypassState | null>(
    ONBOARDING_TEMP_BYPASS_STORAGE_KEY,
    null,
    {
      serializer: {
        read: (value: string) => {
          if (!value) {
            return null;
          }

          try {
            const parsed = JSON.parse(value) as Partial<TemporaryBypassState>;
            if (typeof parsed !== 'object' || parsed === null) {
              return null;
            }

            const active = parsed.active === true;
            const bootMarker = Number(parsed.bootMarker);

            return {
              active,
              bootMarker: Number.isFinite(bootMarker) ? bootMarker : null,
            };
          } catch {
            return null;
          }
        },
        write: (value: TemporaryBypassState | null) => JSON.stringify(value),
      },
    }
  );

  const { isFreshInstall } = storeToRefs(useActivationCodeDataStore());
  const { completed, canDisplayOnboardingModal, isUpgrade } = storeToRefs(useOnboardingStore());
  const { callbackData } = storeToRefs(useCallbackActionsStore());
  const { uptime } = storeToRefs(useServerStore());

  const setIsHidden = (value: boolean | null) => {
    isHidden.value = value;
    if (value === true) {
      isForceOpened.value = false;
    }
  };

  const resetToAutomaticVisibility = () => {
    setIsHidden(null);
  };

  const forceOpenModal = () => {
    if (!canDisplayOnboardingModal.value) {
      return false;
    }

    isForceOpened.value = true;
    setIsHidden(false);
    return true;
  };

  const clearForceOpened = () => {
    isForceOpened.value = false;
  };

  const getCurrentBootMarker = () => {
    const uptimeSeconds = Number(uptime.value);
    if (!Number.isFinite(uptimeSeconds) || uptimeSeconds <= 0) {
      return null;
    }

    const bootEpochSeconds = Date.now() / 1000 - uptimeSeconds;
    return Math.floor(bootEpochSeconds / SECONDS_PER_MINUTE);
  };

  const clearTemporaryBypass = () => {
    temporaryBypassState.value = null;
  };

  const setTemporaryBypass = (enabled: boolean) => {
    if (!enabled) {
      clearTemporaryBypass();
      return;
    }

    // Clear any persisted draft so bypassing does not carry stale onboarding selections.
    clearOnboardingDraftStorage();

    temporaryBypassState.value = {
      active: true,
      bootMarker: getCurrentBootMarker(),
    };
    setIsHidden(true);
  };

  const isBypassActive = computed(() => {
    const state = temporaryBypassState.value;
    if (!state?.active) {
      return false;
    }

    const currentBootMarker = getCurrentBootMarker();
    if (state.bootMarker === null || currentBootMarker === null) {
      // If uptime is not yet available, keep bypass active for this browser session.
      return true;
    }

    return state.bootMarker === currentBootMarker;
  });

  const applyOnboardingUrlAction = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    const action = url.searchParams.get(ONBOARDING_QUERY_ACTION_PARAM);

    if (action === ONBOARDING_URL_ACTION_BYPASS) {
      setTemporaryBypass(true);
    } else if (action === ONBOARDING_URL_ACTION_RESUME) {
      clearTemporaryBypass();
      setIsHidden(false);
    } else if (action === ONBOARDING_URL_ACTION_OPEN) {
      forceOpenModal();
    } else {
      return;
    }

    url.searchParams.delete(ONBOARDING_QUERY_ACTION_PARAM);
    const nextPath = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state ?? null, '', nextPath || '/');
  };

  /**
   * Automatic visibility gate for onboarding:
   * - show if explicitly unhidden (`isHidden === false`)
   * - otherwise show only for fresh installs that are not completed, or upgrade flows, when no callback data is present
   * - manual force-open is handled separately via `isForceOpened`
   */
  const isAutoVisible = computed<boolean>(() => {
    if (isBypassActive.value) {
      return false;
    }
    if (isHidden.value === false) {
      return true;
    }
    return (
      isHidden.value === null &&
      ((isFreshInstall.value && !completed.value) || isUpgrade.value) &&
      !callbackData.value
    );
  });

  watch(isBypassActive, (active) => {
    if (!active && temporaryBypassState.value?.active) {
      clearTemporaryBypass();
    }
  });

  const isBypassShortcut = (event: KeyboardEvent) => {
    if (event.repeat) {
      return false;
    }
    const isPrimaryModifierPressed = event.ctrlKey || event.metaKey;
    return (
      isPrimaryModifierPressed &&
      event.altKey &&
      event.shiftKey &&
      event.code === ONBOARDING_BYPASS_SHORTCUT_CODE
    );
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (isBypassShortcut(event)) {
      event.preventDefault();
      setTemporaryBypass(true);
    }
  };

  const handleForceOpen = () => {
    forceOpenModal();
  };

  onMounted(() => {
    clearLegacyOnboardingModalHiddenSessionState();
    applyOnboardingUrlAction();
    window?.addEventListener('keydown', handleKeydown);
    window?.addEventListener(ONBOARDING_FORCE_OPEN_EVENT, handleForceOpen);
  });

  onUnmounted(() => {
    window?.removeEventListener('keydown', handleKeydown);
    window?.removeEventListener(ONBOARDING_FORCE_OPEN_EVENT, handleForceOpen);
  });

  return {
    isAutoVisible,
    isForceOpened,
    isBypassActive,
    isHidden,
    setIsHidden,
    resetToAutomaticVisibility,
    forceOpenModal,
    clearForceOpened,
    setTemporaryBypass,
    clearTemporaryBypass,
    applyOnboardingUrlAction,
  };
});
