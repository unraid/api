import { graphql } from '~/composables/gql/gql';

export const getConnectSettingsForm = graphql(/* GraphQL */ `
  query GetConnectSettingsForm {
    connectSettingsForm {
      id
      dataSchema
      uiSchema
    }
  }
`);
