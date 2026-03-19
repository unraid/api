import { graphql } from '~/composables/gql';

export const OPEN_ONBOARDING_MUTATION = graphql(/* GraphQL */ `
  mutation OpenOnboarding {
    onboarding {
      openOnboarding {
        status
        completed
        completedAtVersion
        shouldOpen
      }
    }
  }
`);
