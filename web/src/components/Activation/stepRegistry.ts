import type { Component } from 'vue';

import ActivationCoreSettingsStep from '~/components/Activation/ActivationCoreSettingsStep.vue';
import ActivationLicenseStep from '~/components/Activation/ActivationLicenseStep.vue';
import ActivationNextStepsStep from '~/components/Activation/ActivationNextStepsStep.vue';
import ActivationPluginsStep from '~/components/Activation/ActivationPluginsStep.vue';
import ActivationSummaryStep from '~/components/Activation/ActivationSummaryStep.vue';
import ActivationWelcomeStep from '~/components/Activation/ActivationWelcomeStep.vue';

export const stepComponents: Record<string, Component> = {
  OVERVIEW: ActivationWelcomeStep,
  CONFIGURE_SETTINGS: ActivationCoreSettingsStep,
  ADD_PLUGINS: ActivationPluginsStep,
  ACTIVATE_LICENSE: ActivationLicenseStep,
  SUMMARY: ActivationSummaryStep,
  NEXT_STEPS: ActivationNextStepsStep,
};

export type StepMetadataEntry = {
  titleKey: string;
  descriptionKey: string;
  icon: string;
};

export const stepMetadata: Record<string, StepMetadataEntry> = {
  OVERVIEW: {
    titleKey: 'activation.welcomeModal.welcomeToUnraid',
    descriptionKey: 'activation.welcomeModal.getStartedWithYourNewSystem',
    icon: 'i-heroicons-sparkles',
  },
  CONFIGURE_SETTINGS: {
    titleKey: 'activation.coreSettings.title',
    descriptionKey: 'activation.coreSettings.description',
    icon: 'i-heroicons-cog-6-tooth',
  },
  ADD_PLUGINS: {
    titleKey: 'activation.pluginsStep.installEssentialPlugins',
    descriptionKey: 'activation.pluginsStep.addHelpfulPlugins',
    icon: 'i-heroicons-puzzle-piece',
  },
  ACTIVATE_LICENSE: {
    titleKey: 'activation.activationSteps.activateLicense',
    descriptionKey: 'activation.activationSteps.createAnUnraidNetAccountAnd',
    icon: 'i-heroicons-key',
  },
  SUMMARY: {
    titleKey: 'activation.summaryStep.title',
    descriptionKey: 'activation.summaryStep.description',
    icon: 'i-heroicons-clipboard-document-check',
  },
  NEXT_STEPS: {
    titleKey: 'activation.nextSteps.title',
    descriptionKey: 'activation.nextSteps.description',
    icon: 'i-heroicons-arrow-right-circle',
  },
};
