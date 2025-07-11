import { graphql } from '~/composables/gql/gql';

export const getConnectSettingsForm = graphql(/* GraphQL */ `
  query Unified {
    settings {
      unified {
        id
        dataSchema
        uiSchema
        values
      }
    }
  }
`);

export const updateConnectSettings = graphql(/* GraphQL */ `
  mutation UpdateConnectSettings($input: JSON!) {
    updateSettings(input: $input) {
      restartRequired
      values
    }
  }
`);
