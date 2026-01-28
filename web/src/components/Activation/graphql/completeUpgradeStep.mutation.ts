import { graphql } from '~/composables/gql';

export const COMPLETE_UPGRADE_ONBOARDING_MUTATION = graphql(/* GraphQL */ `
  mutation CompleteUpgradeOnboarding {
    onboarding {
      completeUpgradeOnboarding {
        isUpgrade
        previousVersion
        currentVersion
      }
    }
  }
`);
