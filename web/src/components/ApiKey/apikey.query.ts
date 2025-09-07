import { graphql } from '~/composables/gql/gql';

export const API_KEY_FRAGMENT = graphql(/* GraphQL */ `
  fragment ApiKey on ApiKey {
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

export const API_KEY_FRAGMENT_WITH_KEY = API_KEY_FRAGMENT;

export const GET_API_KEYS = graphql(/* GraphQL */ `
  query ApiKeys {
    apiKeys {
      ...ApiKey
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

export const PREVIEW_EFFECTIVE_PERMISSIONS = graphql(/* GraphQL */ `
  query PreviewEffectivePermissions($roles: [Role!], $permissions: [AddPermissionInput!]) {
    previewEffectivePermissions(roles: $roles, permissions: $permissions) {
      resource
      actions
    }
  }
`);
