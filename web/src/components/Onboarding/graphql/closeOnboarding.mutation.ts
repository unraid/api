import { graphql } from '~/composables/gql';

export const CLOSE_ONBOARDING_MUTATION = graphql(/* GraphQL */ `
  mutation CloseOnboarding {
    onboarding {
      closeOnboarding {
        status
        completed
        completedAtVersion
        shouldOpen
      }
    }
  }
`);
