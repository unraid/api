import { graphql } from '~/composables/gql';

export const RESUME_ONBOARDING_MUTATION = graphql(/* GraphQL */ `
  mutation ResumeOnboarding {
    onboarding {
      resumeOnboarding {
        status
        completed
        completedAtVersion
        shouldOpen
      }
    }
  }
`);
