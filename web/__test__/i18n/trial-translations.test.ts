import { describe, expect, it } from 'vitest';

import { createTestI18n } from '../utils/i18n';

describe('Trial Translation Keys', () => {
  it('should load all trial-related translation keys', () => {
    const i18n = createTestI18n();
    const { t } = i18n.global;

    const trialKeys = [
      'registration.trialExpiration',
      'server.actions.extendTrial',
      'server.actions.startTrial',
      'server.state.trial.humanReadable',
      'server.state.trial.messageEligibleInsideRenewal',
      'server.state.trial.messageEligibleOutsideRenewal',
      'server.state.trial.messageIneligibleInsideRenewal',
      'server.state.trial.messageIneligibleOutsideRenewal',
      'server.state.trialExpired.heading',
      'server.state.trialExpired.humanReadable',
      'server.state.trialExpired.messageEligible',
      'server.state.trialExpired.messageIneligible',
      'userProfile.trial.trialKeyCreated',
      'userProfile.trial.trialKeyCreationFailed',
      'userProfile.trial.startingYourFreeDayTrial',
      'userProfile.trial.extendingYourFreeTrialByDays',
      'userProfile.trial.errorCreatiingATrialKeyPlease',
      'userProfile.trial.pleaseKeepThisWindowOpen',
      'userProfile.trial.pleaseWaitWhileThePageReloads',
      'userProfile.uptimeExpire.trialKeyExpired',
      'userProfile.uptimeExpire.trialKeyExpiredAt',
      'userProfile.uptimeExpire.trialKeyExpiresAt',
      'userProfile.uptimeExpire.trialKeyExpiresIn',
      'userProfile.callbackFeedback.calculatingTrialExpiration',
      'userProfile.callbackFeedback.installingExtendedTrial',
      'userProfile.callbackFeedback.yourFreeTrialKeyProvidesAll',
      'userProfile.callbackFeedback.yourTrialKeyHasBeenExtended',
      'userProfile.dropdownTrigger.trialExpiredSeeOptionsBelow',
    ];

    for (const key of trialKeys) {
      const translation = t(key);
      expect(translation).toBeTruthy();
      expect(translation).not.toBe(key);
      expect(typeof translation).toBe('string');
    }
  });

  it('should translate trial expiration keys with parameters', () => {
    const i18n = createTestI18n();
    const { t } = i18n.global;

    const testDate = '2024-01-15 10:30:00';
    const testDuration = '5 days';

    expect(t('userProfile.uptimeExpire.trialKeyExpired', [testDuration])).toContain(testDuration);
    expect(t('userProfile.uptimeExpire.trialKeyExpiredAt', [testDate])).toContain(testDate);
    expect(t('userProfile.uptimeExpire.trialKeyExpiresAt', [testDate])).toContain(testDate);
    expect(t('userProfile.uptimeExpire.trialKeyExpiresIn', [testDuration])).toContain(testDuration);
  });

  it('should have all required trial state messages', () => {
    const i18n = createTestI18n();
    const { t } = i18n.global;

    const stateMessages = [
      'server.state.trial.messageEligibleInsideRenewal',
      'server.state.trial.messageEligibleOutsideRenewal',
      'server.state.trial.messageIneligibleInsideRenewal',
      'server.state.trial.messageIneligibleOutsideRenewal',
      'server.state.trialExpired.messageEligible',
      'server.state.trialExpired.messageIneligible',
    ];

    for (const key of stateMessages) {
      const message = t(key);
      expect(message).toBeTruthy();
      expect(message.length).toBeGreaterThan(0);
      expect(message).toMatch(/<p>/);
    }
  });

  it('should have trial action translations', () => {
    const i18n = createTestI18n();
    const { t } = i18n.global;

    expect(t('server.actions.extendTrial')).toBe('Extend Trial');
    expect(t('server.actions.startTrial')).toBe('Start Free 30 Day Trial');
  });
});
