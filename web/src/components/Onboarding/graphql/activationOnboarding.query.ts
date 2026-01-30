import { graphql } from '~/composables/gql';

export const ONBOARDING_QUERY = graphql(/* GraphQL */ `
  query Onboarding {
    onboarding {
      status
      isPartnerBuild
      completed
      completedAtVersion
    }
  }
`);
