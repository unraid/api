import { graphql } from '~/composables/gql';

export const CLOSE_ONBOARDING_MUTATION = graphql(/* GraphQL */ `
  mutation CloseOnboarding($input: CloseOnboardingInput) {
    onboarding {
      closeOnboarding(input: $input) {
        status
        completed
        completedAtVersion
        shouldOpen
      }
    }
  }
`);
