import { graphql } from '~/composables/gql/gql.js';

export const SAVE_ONBOARDING_DRAFT_MUTATION = graphql(/* GraphQL */ `
  mutation SaveOnboardingDraft($input: SaveOnboardingDraftInput!) {
    onboarding {
      saveOnboardingDraft(input: $input)
    }
  }
`);
