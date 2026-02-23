import { ONBOARDING_TEMP_BYPASS_STORAGE_KEY } from '~/consts';

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

export const clearOnboardingDraftStorage = () => {
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

export const cleanupOnboardingStorage = (options?: { clearTemporaryBypassSessionState?: boolean }) => {
  clearOnboardingDraftStorage();

  if (options?.clearTemporaryBypassSessionState) {
    clearTemporaryBypassSessionState();
  }
};
