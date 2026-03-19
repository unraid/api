import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it } from 'vitest';

import { ONBOARDING_MODAL_HIDDEN_STORAGE_KEY } from '~/components/Onboarding/constants';
import { useOnboardingDraftStore } from '~/components/Onboarding/store/onboardingDraft';
import {
  cleanupOnboardingStorage,
  clearLegacyOnboardingModalHiddenSessionState,
  clearOnboardingDraftStorage,
} from '~/components/Onboarding/store/onboardingStorageCleanup';

describe('onboardingStorageCleanup', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('clears onboarding draft keys from localStorage', () => {
    window.localStorage.setItem('onboardingDraft', '{"currentStepIndex":2}');
    window.localStorage.setItem('pinia-onboardingDraft', '{"currentStepIndex":1}');
    window.localStorage.setItem('unrelatedKey', 'keep');

    clearOnboardingDraftStorage();

    expect(window.localStorage.getItem('onboardingDraft')).toBeNull();
    expect(window.localStorage.getItem('pinia-onboardingDraft')).toBeNull();
    expect(window.localStorage.getItem('unrelatedKey')).toBe('keep');
  });

  it('resets the live onboarding draft store when clearing storage', () => {
    const draftStore = useOnboardingDraftStore();
    draftStore.setCoreSettings({
      serverName: 'tower',
      serverDescription: 'test',
      timeZone: 'UTC',
      theme: 'black',
      language: 'en_US',
      useSsh: true,
    });
    draftStore.setCurrentStep('CONFIGURE_BOOT', 2);

    clearOnboardingDraftStorage();

    expect(draftStore.hasResumableDraft).toBe(false);
    expect(draftStore.currentStepIndex).toBe(0);
    expect(draftStore.currentStepId).toBeNull();
    expect(draftStore.coreSettingsInitialized).toBe(false);
  });

  it('clears legacy hidden onboarding key from sessionStorage', () => {
    window.sessionStorage.setItem(ONBOARDING_MODAL_HIDDEN_STORAGE_KEY, 'true');

    clearLegacyOnboardingModalHiddenSessionState();

    expect(window.sessionStorage.getItem(ONBOARDING_MODAL_HIDDEN_STORAGE_KEY)).toBeNull();
  });

  it('cleans draft storage and legacy hidden onboarding key together', () => {
    window.localStorage.setItem('onboardingDraft', '{"currentStepIndex":4}');
    window.sessionStorage.setItem(ONBOARDING_MODAL_HIDDEN_STORAGE_KEY, 'true');

    cleanupOnboardingStorage();

    expect(window.localStorage.getItem('onboardingDraft')).toBeNull();
    expect(window.sessionStorage.getItem(ONBOARDING_MODAL_HIDDEN_STORAGE_KEY)).toBeNull();
  });
});
