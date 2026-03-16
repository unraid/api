import { describe, expect, it } from 'vitest';

import { shouldPersistOnboardingDraftState } from '~/components/Onboarding/store/onboardingDraft';

describe('onboardingDraft persistence', () => {
  it('does not persist an empty reset draft shell', () => {
    expect(
      shouldPersistOnboardingDraftState({
        serverName: '',
        serverDescription: '',
        selectedTimeZone: '',
        selectedTheme: '',
        selectedLanguage: '',
        useSsh: false,
        coreSettingsInitialized: false,
        selectedPlugins: [],
        pluginSelectionInitialized: false,
        internalBootSelection: null,
        bootMode: 'usb',
        internalBootInitialized: false,
        internalBootSkipped: false,
        internalBootApplySucceeded: false,
        currentStepIndex: 0,
        currentStepId: null,
      })
    ).toBe(false);
  });

  it('persists an initialized draft', () => {
    expect(
      shouldPersistOnboardingDraftState({
        coreSettingsInitialized: true,
        currentStepId: 'CONFIGURE_SETTINGS',
      })
    ).toBe(true);
  });
});
