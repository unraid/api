import { graphql } from '~/composables/gql/gql';

export const getConnectSettingsForm = graphql(/* GraphQL */ `
  query GetConnectSettingsForm {
    connect {
      id
      settings {
        id
        dataSchema
        uiSchema
        values {
          sandbox
          extraOrigins
          accessType
          forwardType
          port
        }
      }
    }
  }
`);

export const updateConnectSettings = graphql(/* GraphQL */ `
  mutation UpdateConnectSettings($input: ApiSettingsInput!) {
    updateApiSettings(input: $input) {
      sandbox
      extraOrigins
      accessType
      forwardType
      port
    }
  }
`);
