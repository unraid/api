import type { Component } from 'vue';

import OnboardingCoreSettingsStep from '~/components/Onboarding/steps/OnboardingCoreSettingsStep.vue';
import OnboardingLicenseStep from '~/components/Onboarding/steps/OnboardingLicenseStep.vue';
import OnboardingNextStepsStep from '~/components/Onboarding/steps/OnboardingNextStepsStep.vue';
import OnboardingOverviewStep from '~/components/Onboarding/steps/OnboardingOverviewStep.vue';
import OnboardingPluginsStep from '~/components/Onboarding/steps/OnboardingPluginsStep.vue';
import OnboardingSummaryStep from '~/components/Onboarding/steps/OnboardingSummaryStep.vue';

export const stepComponents: Record<string, Component> = {
  OVERVIEW: OnboardingOverviewStep,
  CONFIGURE_SETTINGS: OnboardingCoreSettingsStep,
  ADD_PLUGINS: OnboardingPluginsStep,
  ACTIVATE_LICENSE: OnboardingLicenseStep,
  SUMMARY: OnboardingSummaryStep,
  NEXT_STEPS: OnboardingNextStepsStep,
};

export type StepMetadataEntry = {
  titleKey: string;
  descriptionKey: string;
  icon: string;
};

export const stepMetadata: Record<string, StepMetadataEntry> = {
  OVERVIEW: {
    titleKey: 'onboarding.overviewStep.welcomeToUnraid',
    descriptionKey: 'onboarding.overviewStep.getStartedWithYourNewSystem',
    icon: 'i-heroicons-sparkles',
  },
  CONFIGURE_SETTINGS: {
    titleKey: 'onboarding.coreSettings.title',
    descriptionKey: 'onboarding.coreSettings.description',
    icon: 'i-heroicons-cog-6-tooth',
  },
  ADD_PLUGINS: {
    titleKey: 'onboarding.pluginsStep.installEssentialPlugins',
    descriptionKey: 'onboarding.pluginsStep.addHelpfulPlugins',
    icon: 'i-heroicons-puzzle-piece',
  },
  ACTIVATE_LICENSE: {
    titleKey: 'onboarding.activationSteps.activateLicense',
    descriptionKey: 'onboarding.activationSteps.createAnUnraidNetAccountAnd',
    icon: 'i-heroicons-key',
  },
  SUMMARY: {
    titleKey: 'onboarding.summaryStep.title',
    descriptionKey: 'onboarding.summaryStep.description',
    icon: 'i-heroicons-clipboard-document-check',
  },
  NEXT_STEPS: {
    titleKey: 'onboarding.nextSteps.title',
    descriptionKey: 'onboarding.nextSteps.description',
    icon: 'i-heroicons-arrow-right-circle',
  },
};
