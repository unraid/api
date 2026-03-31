import { beforeEach, describe, expect, it } from 'vitest';

import { ONBOARDING_MODAL_HIDDEN_STORAGE_KEY } from '~/components/Onboarding/constants';
import {
  cleanupOnboardingStorage,
  clearLegacyOnboardingModalHiddenSessionState,
  clearOnboardingDraftStorage,
} from '~/components/Onboarding/store/onboardingStorageCleanup';

describe('onboardingStorageCleanup', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('clears onboarding draft keys from localStorage', () => {
    window.localStorage.setItem('onboardingDraft', '{"currentStepId":"CONFIGURE_BOOT"}');
    window.localStorage.setItem('pinia-onboardingDraft', '{"currentStepId":"ADD_PLUGINS"}');
    window.localStorage.setItem('unrelatedKey', 'keep');

    clearOnboardingDraftStorage();

    expect(window.localStorage.getItem('onboardingDraft')).toBeNull();
    expect(window.localStorage.getItem('pinia-onboardingDraft')).toBeNull();
    expect(window.localStorage.getItem('unrelatedKey')).toBe('keep');
  });

  it('removes every onboarding draft storage variant without touching session state', () => {
    window.localStorage.setItem('pinia-onboardingDraft:legacy', '{"currentStepId":"SUMMARY"}');
    window.sessionStorage.setItem(ONBOARDING_MODAL_HIDDEN_STORAGE_KEY, 'true');

    clearOnboardingDraftStorage();

    expect(window.localStorage.getItem('pinia-onboardingDraft:legacy')).toBeNull();
    expect(window.sessionStorage.getItem(ONBOARDING_MODAL_HIDDEN_STORAGE_KEY)).toBe('true');
  });

  it('clears legacy hidden onboarding key from sessionStorage', () => {
    window.sessionStorage.setItem(ONBOARDING_MODAL_HIDDEN_STORAGE_KEY, 'true');

    clearLegacyOnboardingModalHiddenSessionState();

    expect(window.sessionStorage.getItem(ONBOARDING_MODAL_HIDDEN_STORAGE_KEY)).toBeNull();
  });

  it('cleans draft storage and legacy hidden onboarding key together', () => {
    window.localStorage.setItem('onboardingDraft', '{"currentStepId":"SUMMARY"}');
    window.sessionStorage.setItem(ONBOARDING_MODAL_HIDDEN_STORAGE_KEY, 'true');

    cleanupOnboardingStorage();

    expect(window.localStorage.getItem('onboardingDraft')).toBeNull();
    expect(window.sessionStorage.getItem(ONBOARDING_MODAL_HIDDEN_STORAGE_KEY)).toBeNull();
  });
});
