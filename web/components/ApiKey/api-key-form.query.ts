import { graphql } from '~/composables/gql';

export const GET_API_KEY_CREATION_FORM_SCHEMA = graphql(`
  query GetApiKeyCreationFormSchema {
    getApiKeyCreationFormSchema {
      id
      dataSchema
      uiSchema
      values
    }
  }
`);

