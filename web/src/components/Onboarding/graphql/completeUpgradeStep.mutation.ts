import { graphql } from '~/composables/gql';

export const COMPLETE_ONBOARDING_MUTATION = graphql(/* GraphQL */ `
  mutation CompleteOnboarding {
    onboarding {
      completeOnboarding {
        status
        isPartnerBuild
        completed
        completedAtVersion
      }
    }
  }
`);
