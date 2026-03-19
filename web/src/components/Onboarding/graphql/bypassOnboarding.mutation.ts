import { graphql } from '~/composables/gql';

export const BYPASS_ONBOARDING_MUTATION = graphql(/* GraphQL */ `
  mutation BypassOnboarding {
    onboarding {
      bypassOnboarding {
        status
        completed
        completedAtVersion
        shouldOpen
      }
    }
  }
`);
