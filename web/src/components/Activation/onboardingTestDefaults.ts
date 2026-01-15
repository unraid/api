import { ActivationOnboardingStepId } from '~/composables/gql/graphql';

export type ActivationOnboardingStepOverride = {
  id: ActivationOnboardingStepId;
  required?: boolean;
  completed?: boolean;
  introducedIn?: string;
};

export const DEFAULT_ACTIVATION_STEPS: ActivationOnboardingStepOverride[] = [
  {
    id: ActivationOnboardingStepId.WELCOME,
    required: false,
    completed: false,
    introducedIn: '7.0.0',
  },
  {
    id: ActivationOnboardingStepId.TIMEZONE,
    required: true,
    completed: false,
    introducedIn: '7.0.0',
  },
  {
    id: ActivationOnboardingStepId.PLUGINS,
    required: false,
    completed: false,
    introducedIn: '7.0.0',
  },
  {
    id: ActivationOnboardingStepId.ACTIVATION,
    required: true,
    completed: false,
    introducedIn: '7.0.0',
  },
];
