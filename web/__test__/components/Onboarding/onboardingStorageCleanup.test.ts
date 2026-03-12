import { beforeEach, describe, expect, it } from 'vitest';

import {
  ONBOARDING_MODAL_HIDDEN_STORAGE_KEY,
  ONBOARDING_TEMP_BYPASS_STORAGE_KEY,
} from '~/components/Onboarding/constants';
import {
  cleanupOnboardingStorage,
  clearLegacyOnboardingModalHiddenSessionState,
  clearOnboardingDraftStorage,
  clearTemporaryBypassSessionState,
} from '~/components/Onboarding/store/onboardingStorageCleanup';

describe('onboardingStorageCleanup', () => {
  beforeEach(() => {
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

  it('clears temporary bypass key from sessionStorage', () => {
    window.sessionStorage.setItem(ONBOARDING_TEMP_BYPASS_STORAGE_KEY, '{"active":true}');

    clearTemporaryBypassSessionState();

    expect(window.sessionStorage.getItem(ONBOARDING_TEMP_BYPASS_STORAGE_KEY)).toBeNull();
  });

  it('clears legacy hidden onboarding key from sessionStorage', () => {
    window.sessionStorage.setItem(ONBOARDING_MODAL_HIDDEN_STORAGE_KEY, 'true');

    clearLegacyOnboardingModalHiddenSessionState();

    expect(window.sessionStorage.getItem(ONBOARDING_MODAL_HIDDEN_STORAGE_KEY)).toBeNull();
  });

  it('cleans draft storage and optional temporary bypass key together', () => {
    window.localStorage.setItem('onboardingDraft', '{"currentStepIndex":4}');
    window.sessionStorage.setItem(ONBOARDING_MODAL_HIDDEN_STORAGE_KEY, 'true');
    window.sessionStorage.setItem(ONBOARDING_TEMP_BYPASS_STORAGE_KEY, '{"active":true}');

    cleanupOnboardingStorage({ clearTemporaryBypassSessionState: true });

    expect(window.localStorage.getItem('onboardingDraft')).toBeNull();
    expect(window.sessionStorage.getItem(ONBOARDING_MODAL_HIDDEN_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(ONBOARDING_TEMP_BYPASS_STORAGE_KEY)).toBeNull();
  });
});
