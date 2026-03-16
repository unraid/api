import { getActivePinia } from 'pinia';

import {
  ONBOARDING_MODAL_HIDDEN_STORAGE_KEY,
  ONBOARDING_TEMP_BYPASS_STORAGE_KEY,
} from '~/components/Onboarding/constants';
import { useOnboardingDraftStore } from '~/components/Onboarding/store/onboardingDraft';

const ONBOARDING_DRAFT_STORAGE_KEY = 'onboardingDraft';

const getLocalStorageKeys = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return Object.keys(window.localStorage);
  } catch {
    return [];
  }
};

const resetLiveOnboardingDraftStore = () => {
  if (!getActivePinia()) {
    return;
  }

  useOnboardingDraftStore().resetDraft();
};

export const clearOnboardingDraftStorage = () => {
  resetLiveOnboardingDraftStore();

  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);

    const keysToRemove = getLocalStorageKeys().filter((key) =>
      key.includes(ONBOARDING_DRAFT_STORAGE_KEY)
    );
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Best effort only.
  }
};

export const clearTemporaryBypassSessionState = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(ONBOARDING_TEMP_BYPASS_STORAGE_KEY);
  } catch {
    // Best effort only.
  }
};

export const clearLegacyOnboardingModalHiddenSessionState = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(ONBOARDING_MODAL_HIDDEN_STORAGE_KEY);
  } catch {
    // Best effort only.
  }
};

export const cleanupOnboardingStorage = (options?: { clearTemporaryBypassSessionState?: boolean }) => {
  clearOnboardingDraftStorage();
  clearLegacyOnboardingModalHiddenSessionState();

  if (options?.clearTemporaryBypassSessionState) {
    clearTemporaryBypassSessionState();
  }
};
