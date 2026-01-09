import { graphql } from '~/composables/gql';

export const COMPLETE_UPGRADE_STEP_MUTATION = graphql(/* GraphQL */ `
  mutation CompleteUpgradeStep($input: CompleteUpgradeStepInput!) {
    onboarding {
      completeUpgradeStep(input: $input) {
        isUpgrade
        previousVersion
        currentVersion
        completedSteps
        steps {
          id
          required
          introducedIn
        }
      }
    }
  }
`);
