import { graphql } from '~/composables/gql/gql';

export const API_KEY_FRAGMENT = graphql(/* GraphQL */ `
  fragment ApiKey on ApiKey {
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
`);

export const API_KEY_FRAGMENT_WITH_KEY = graphql(/* GraphQL */ `
  fragment ApiKeyWithKey on ApiKeyWithSecret {
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
`);

export const GET_API_KEYS = graphql(/* GraphQL */ `
  query ApiKeys {
    apiKeys {
      ...ApiKey
    }
  }
`);

export const CREATE_API_KEY = graphql(/* GraphQL */ `
  mutation CreateApiKey($input: CreateApiKeyInput!) {
    apiKey {
      create(input: $input) {
        ...ApiKeyWithKey
      }
    } 
  }
`);

export const UPDATE_API_KEY = graphql(/* GraphQL */ `
  mutation UpdateApiKey($input: UpdateApiKeyInput!) {
    apiKey {
      update(input: $input) {
        ...ApiKeyWithKey
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
