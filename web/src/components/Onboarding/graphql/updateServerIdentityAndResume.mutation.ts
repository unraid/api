import { graphql } from '~/composables/gql/gql.js';

export const UPDATE_SERVER_IDENTITY_AND_RESUME_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateServerIdentityAndResume(
    $name: String!
    $comment: String
    $sysModel: String
    $input: SaveOnboardingDraftInput!
  ) {
    updateServerIdentity(name: $name, comment: $comment, sysModel: $sysModel) {
      id
      name
      comment
      defaultUrl
    }
    onboarding {
      saveOnboardingDraft(input: $input)
    }
  }
`);
