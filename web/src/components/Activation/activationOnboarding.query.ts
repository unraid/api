import { graphql } from '~/composables/gql';

export const ACTIVATION_ONBOARDING_QUERY = graphql(/* GraphQL */ `
  query ActivationOnboarding {
    activationOnboarding {
      isUpgrade
      previousVersion
      currentVersion
      hasPendingSteps
      steps {
        id
        required
        completed
        introducedIn
      }
    }
  }
`);
