import {
  submitInternalBootReboot,
  submitInternalBootShutdown,
} from '~/components/Onboarding/composables/internalBoot';
import { cleanupOnboardingStorage } from '~/components/Onboarding/store/onboardingStorageCleanup';

export type OnboardingPowerAction = 'reboot' | 'shutdown';

type UseOnboardingLifecycleOptions = {
  completeOnboarding: () => Promise<unknown>;
  refetchOnboarding: () => Promise<unknown>;
  finalizeUiClose: () => Promise<void> | void;
};

export const useOnboardingLifecycle = ({
  completeOnboarding,
  refetchOnboarding,
  finalizeUiClose,
}: UseOnboardingLifecycleOptions) => {
  const attemptCompleteOnboarding = async ({ allowFailure = false } = {}) => {
    try {
      await completeOnboarding();

      try {
        await refetchOnboarding();
      } catch (error: unknown) {
        console.error('Failed to refresh onboarding state:', error);
      }
    } catch (error: unknown) {
      console.error('Failed to complete onboarding:', error);
      if (!allowFailure) {
        throw error;
      }
    }
  };

  const dismissOnboarding = async () => {
    await attemptCompleteOnboarding({ allowFailure: true });
    cleanupOnboardingStorage();
    await Promise.resolve(finalizeUiClose());
  };

  const completeAndCloseOnboarding = async () => {
    await attemptCompleteOnboarding();
    cleanupOnboardingStorage();
    await Promise.resolve(finalizeUiClose());
  };

  const completeOnboardingWithPowerAction = async (action: OnboardingPowerAction) => {
    await attemptCompleteOnboarding({ allowFailure: true });
    cleanupOnboardingStorage();

    if (action === 'shutdown') {
      submitInternalBootShutdown();
      return;
    }

    submitInternalBootReboot();
  };

  return {
    dismissOnboarding,
    completeAndCloseOnboarding,
    completeOnboardingWithPowerAction,
  };
};
