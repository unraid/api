import { graphql } from '~/composables/gql';

export const GET_API_KEY_CREATION_FORM_SCHEMA = graphql(`
  query GetApiKeyCreationFormSchema {
    getApiKeyCreationFormSchema {
      schema
      uiSchema
      formData
    }
  }
`);

export const GET_API_KEY_AUTHORIZATION_FORM_SCHEMA = graphql(`
  query GetApiKeyAuthorizationFormSchema($appName: String!, $requestedScopes: [String!]!, $appDescription: String) {
    getApiKeyAuthorizationFormSchema(
      appName: $appName
      requestedScopes: $requestedScopes
      appDescription: $appDescription
    ) {
      schema
      uiSchema
      formData
    }
  }
`);
