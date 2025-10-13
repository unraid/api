import type { StepComponentRegistry } from '~/components/Activation/steps/types';

import ActivationTimezoneStep from '~/components/Activation/ActivationTimezoneStep.vue';

export const timezoneStep = {
  id: 'timezone',
  component: ActivationTimezoneStep,
} satisfies StepComponentRegistry['timezone'];
