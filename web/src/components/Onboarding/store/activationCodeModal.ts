import { computed, onMounted, onUnmounted, watch } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { useSessionStorage } from '@vueuse/core';

import { ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY, ONBOARDING_TEMP_BYPASS_STORAGE_KEY } from '~/consts';

import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { clearOnboardingDraftStorage } from '~/components/Onboarding/store/onboardingStorageCleanup';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useServerStore } from '~/store/server';

const ONBOARDING_QUERY_PARAM = 'onboarding';
const ONBOARDING_BYPASS_SHORTCUT_CODE = 'KeyO';
const SECONDS_PER_MINUTE = 60;

type TemporaryBypassState = {
  active: boolean;
  bootMarker: number | null;
};

export const useActivationCodeModalStore = defineStore('activationCodeModal', () => {
  const isHidden = useSessionStorage<boolean | null>(ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY, null);
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
  const { callbackData } = storeToRefs(useCallbackActionsStore());
  const { uptime } = storeToRefs(useServerStore());

  const setIsHidden = (value: boolean | null) => {
    isHidden.value = value;
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

  const isTemporarilyBypassed = computed(() => {
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

  const applyBypassFromUrlParam = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    const action = url.searchParams.get(ONBOARDING_QUERY_PARAM);

    if (action === 'bypass') {
      setTemporaryBypass(true);
    } else if (action === 'resume') {
      clearTemporaryBypass();
      setIsHidden(false);
    } else {
      return;
    }

    url.searchParams.delete(ONBOARDING_QUERY_PARAM);
    const nextPath = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, '', nextPath || '/');
  };

  /**
   * Should only see this if
   * 1. It's explicitly set to show (isHidden === false)
   * OR
   * 2. It's a fresh server install where no keyfile has been present before
   * 3. there's not callback data
   * 4. it's not been explicitly hidden (isHidden === null)
   *
   * Shows for:
   * - Fresh installs with activation code (timezone → plugins → activation flow)
   * - Fresh installs without activation code (timezone → plugins)
   *
   * Note: Upgrade onboarding visibility is checked separately in the modal via upgradeOnboardingStore
   */
  const isVisible = computed<boolean>(() => {
    if (isTemporarilyBypassed.value) {
      return false;
    }
    if (isHidden.value === false) {
      return true;
    }
    return isHidden.value === null && isFreshInstall.value && !callbackData.value;
  });

  watch(isTemporarilyBypassed, (active) => {
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

  onMounted(() => {
    applyBypassFromUrlParam();
    window?.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    window?.removeEventListener('keydown', handleKeydown);
  });

  return {
    isVisible,
    isTemporarilyBypassed,
    isHidden,
    setIsHidden,
    setTemporaryBypass,
    clearTemporaryBypass,
    applyBypassFromUrlParam,
  };
});
