import gql from 'graphql-tag';

export const PREVIEW_EFFECTIVE_PERMISSIONS = gql`
  query PreviewEffectivePermissions($roles: [Role!], $permissions: [AddPermissionInput!]) {
    previewEffectivePermissions(roles: $roles, permissions: $permissions) {
      resource
      actions
    }
  }
`;

export const GET_PERMISSIONS_FOR_ROLES = gql`
  query GetPermissionsForRoles($roles: [Role!]!) {
    getPermissionsForRoles(roles: $roles) {
      resource
      actions
    }
  }
`;
