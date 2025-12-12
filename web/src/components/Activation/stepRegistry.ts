import type { ActivationOnboardingStepId } from '~/composables/gql/graphql';
import type { Component } from 'vue';

import ActivationLicenseStep from '~/components/Activation/ActivationLicenseStep.vue';
import ActivationPluginsStep from '~/components/Activation/ActivationPluginsStep.vue';
import ActivationTimezoneStep from '~/components/Activation/ActivationTimezoneStep.vue';
import ActivationWelcomeStep from '~/components/Activation/ActivationWelcomeStep.vue';

export const stepComponents: Record<ActivationOnboardingStepId, Component> = {
  WELCOME: ActivationWelcomeStep,
  TIMEZONE: ActivationTimezoneStep,
  PLUGINS: ActivationPluginsStep,
  ACTIVATION: ActivationLicenseStep,
};

export type StepMetadataEntry = {
  titleKey: string;
  descriptionKey: string;
  icon: string;
};

export const stepMetadata: Record<ActivationOnboardingStepId, StepMetadataEntry> = {
  WELCOME: {
    titleKey: 'activation.welcomeModal.welcomeToUnraid',
    descriptionKey: 'activation.welcomeModal.getStartedWithYourNewSystem',
    icon: 'i-heroicons-sparkles',
  },
  TIMEZONE: {
    titleKey: 'activation.timezoneStep.setYourTimeZone',
    descriptionKey: 'activation.timezoneStep.selectTimezoneDescription',
    icon: 'i-heroicons-clock',
  },
  PLUGINS: {
    titleKey: 'activation.pluginsStep.installEssentialPlugins',
    descriptionKey: 'activation.pluginsStep.addHelpfulPlugins',
    icon: 'i-heroicons-puzzle-piece',
  },
  ACTIVATION: {
    titleKey: 'activation.activationSteps.activateLicense',
    descriptionKey: 'activation.activationSteps.createAnUnraidNetAccountAnd',
    icon: 'i-heroicons-key',
  },
};
