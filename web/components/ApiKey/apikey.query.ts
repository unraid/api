import { graphql } from '~/composables/gql/gql';


export const GET_API_KEYS = graphql(/* GraphQL */ `
  query ApiKeys {
    apiKeys {
      id
      name
      description
      createdAt
      roles
      permissions {
        resource
        actions
      }
    }
  }
`);

export const CREATE_API_KEY = graphql(/* GraphQL */ `
  mutation CreateApiKey($input: CreateApiKeyInput!) {
    apiKey {
      create(input: $input) {
        id
        key
        name
        description
        createdAt
        roles
        permissions {
          resource
          actions
        }
      }
    }
  }
`);

export const DELETE_API_KEY = graphql(/* GraphQL */ `
  mutation DeleteApiKey($input: DeleteApiKeyInput!) {
    apiKey {
      delete(input: $input)
    }
  }
`);

export const GET_API_KEY_META = graphql(/* GraphQL */ `
  query ApiKeyMeta {
    apiKeyPossibleRoles
    apiKeyPossiblePermissions {
      resource
      actions
    }
  }
`);
