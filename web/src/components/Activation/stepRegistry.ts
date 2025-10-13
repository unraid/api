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

export const stepMetadata: Record<
  ActivationOnboardingStepId,
  { title: string; description: string; icon: string }
> = {
  WELCOME: {
    title: 'Welcome to Unraid',
    description: 'Get started with your new Unraid system',
    icon: 'i-heroicons-sparkles',
  },
  TIMEZONE: {
    title: 'Set Time Zone',
    description: 'Configure system time',
    icon: 'i-heroicons-clock',
  },
  PLUGINS: {
    title: 'Install Essential Plugins',
    description: 'Add helpful plugins',
    icon: 'i-heroicons-puzzle-piece',
  },
  ACTIVATION: {
    title: 'Activate License',
    description: 'Create an Unraid.net account and activate your key',
    icon: 'i-heroicons-key',
  },
};
