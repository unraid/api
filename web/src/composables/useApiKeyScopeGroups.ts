import { AuthAction, Resource, Role } from '~/composables/gql/graphql';

/**
 * Create a scope string from a role
 * @param role - The role to convert
 * @returns Scope string like "role:admin"
 */
export function roleToScope(role: Role | string): string {
  return `role:${role.toLowerCase()}`;
}

/**
 * Create a scope string from resource and action
 * @param resource - The resource
 * @param action - The action (can be verb, AuthAction, or wildcard)
 * @returns Scope string like "docker:read" or "docker:*"
 */
export function permissionToScope(resource: Resource | string, action: string): string {
  return `${resource.toLowerCase()}:${action.toLowerCase()}`;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  icon?: string;
  permissions: Array<{
    resource: Resource;
    actions: AuthAction[];
  }>;
}

// Permission groups that generate explicit permissions
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'docker_manager',
    name: 'Docker Manager',
    description: 'Full access to Docker containers and images',
    icon: 'docker',
    permissions: [
      {
        resource: Resource.DOCKER,
        actions: [
          AuthAction.CREATE_ANY,
          AuthAction.READ_ANY,
          AuthAction.UPDATE_ANY,
          AuthAction.DELETE_ANY,
        ],
      },
      { resource: Resource.ARRAY, actions: [AuthAction.READ_ANY] },
      { resource: Resource.DISK, actions: [AuthAction.READ_ANY] },
      { resource: Resource.NETWORK, actions: [AuthAction.READ_ANY] },
    ],
  },
  {
    id: 'vm_manager',
    name: 'VM Manager',
    description: 'Full access to virtual machines',
    icon: 'computer',
    permissions: [
      {
        resource: Resource.VMS,
        actions: [
          AuthAction.CREATE_ANY,
          AuthAction.READ_ANY,
          AuthAction.UPDATE_ANY,
          AuthAction.DELETE_ANY,
        ],
      },
      { resource: Resource.ARRAY, actions: [AuthAction.READ_ANY] },
      { resource: Resource.DISK, actions: [AuthAction.READ_ANY] },
      { resource: Resource.NETWORK, actions: [AuthAction.READ_ANY] },
    ],
  },
  {
    id: 'backup_manager',
    name: 'Backup Manager',
    description: 'Access to manage backups and flash storage',
    icon: 'archive',
    permissions: [
      {
        resource: Resource.FLASH,
        actions: [
          AuthAction.CREATE_ANY,
          AuthAction.READ_ANY,
          AuthAction.UPDATE_ANY,
          AuthAction.DELETE_ANY,
        ],
      },
      { resource: Resource.ARRAY, actions: [AuthAction.READ_ANY] },
      { resource: Resource.DISK, actions: [AuthAction.READ_ANY] },
      { resource: Resource.SHARE, actions: [AuthAction.READ_ANY] },
    ],
  },
  {
    id: 'network_admin',
    name: 'Network Admin',
    description: 'Full network configuration access',
    icon: 'network',
    permissions: [
      {
        resource: Resource.NETWORK,
        actions: [
          AuthAction.CREATE_ANY,
          AuthAction.READ_ANY,
          AuthAction.UPDATE_ANY,
          AuthAction.DELETE_ANY,
        ],
      },
      {
        resource: Resource.SERVICES,
        actions: [
          AuthAction.CREATE_ANY,
          AuthAction.READ_ANY,
          AuthAction.UPDATE_ANY,
          AuthAction.DELETE_ANY,
        ],
      },
    ],
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    description: 'Read-only access for monitoring and dashboards',
    icon: 'chart-bar',
    permissions: [
      { resource: Resource.DOCKER, actions: [AuthAction.READ_ANY] },
      { resource: Resource.VMS, actions: [AuthAction.READ_ANY] },
      { resource: Resource.ARRAY, actions: [AuthAction.READ_ANY] },
      { resource: Resource.DISK, actions: [AuthAction.READ_ANY] },
      { resource: Resource.NETWORK, actions: [AuthAction.READ_ANY] },
      { resource: Resource.INFO, actions: [AuthAction.READ_ANY] },
      { resource: Resource.DASHBOARD, actions: [AuthAction.READ_ANY] },
      { resource: Resource.LOGS, actions: [AuthAction.READ_ANY] },
    ],
  },
];

// Core roles with descriptions
export interface RoleInfo {
  role: Role;
  name: string;
  description: string;
  icon?: string;
}

export const CORE_ROLES: RoleInfo[] = [
  {
    role: Role.ADMIN,
    name: 'Administrator',
    description: 'Full administrative access to all resources',
    icon: 'shield',
  },
  {
    role: Role.VIEWER,
    name: 'Read Only',
    description: 'Read-only access to all resources',
    icon: 'eye',
  },
  {
    role: Role.CONNECT,
    name: 'Connect',
    description: 'Internal role for Unraid Connect',
    icon: 'link',
  },
  {
    role: Role.GUEST,
    name: 'Guest',
    description: 'Basic profile access only',
    icon: 'user',
  },
];

/**
 * Convert permissions and roles to scope strings
 */
export function convertPermissionsToScopes(
  permissions: Array<{ resource: Resource; actions: AuthAction[] }>,
  roles: Role[]
): string[] {
  const scopes: string[] = [];

  // Convert permissions to scopes
  for (const perm of permissions) {
    // Check if all CRUD actions are selected (means wildcard)
    const hasAllActions =
      perm.actions.includes(AuthAction.CREATE_ANY) &&
      perm.actions.includes(AuthAction.READ_ANY) &&
      perm.actions.includes(AuthAction.UPDATE_ANY) &&
      perm.actions.includes(AuthAction.DELETE_ANY);

    if (hasAllActions) {
      scopes.push(permissionToScope(perm.resource, '*'));
    } else {
      // Add individual action scopes using shared utility
      for (const action of perm.actions) {
        scopes.push(permissionToScope(perm.resource, action));
      }
    }
  }

  // Convert roles to scopes using shared utility
  for (const role of roles) {
    scopes.push(roleToScope(role));
  }

  return scopes;
}

/**
 * Build an authorization URL with the given parameters
 */
export function buildAuthorizationUrl(
  baseUrl: string,
  appName: string,
  scopes: string[],
  options?: {
    appDescription?: string;
    redirectUri?: string;
    state?: string;
  }
): string {
  const url = new URL(`${baseUrl}/ApiKeyAuthorize`);

  url.searchParams.set('name', appName);
  url.searchParams.set('scopes', scopes.join(','));

  if (options?.appDescription) {
    url.searchParams.set('description', options.appDescription);
  }
  if (options?.redirectUri) {
    url.searchParams.set('redirect_uri', options.redirectUri);
  }
  if (options?.state) {
    url.searchParams.set('state', options.state);
  }

  return url.toString();
}

/**
 * Composable for API key scope groups functionality
 */
export function useApiKeyScopeGroups() {
  const permissionGroups = PERMISSION_GROUPS;
  const coreRoles = CORE_ROLES;

  /**
   * Get role info by role
   */
  const getRoleInfo = (role: Role): RoleInfo | undefined => {
    return coreRoles.find((r) => r.role === role);
  };

  /**
   * Get permission group by ID
   */
  const getPermissionGroup = (id: string): PermissionGroup | undefined => {
    return permissionGroups.find((g) => g.id === id);
  };

  /**
   * Convert permission group to explicit permissions
   */
  const getPermissionsFromGroup = (
    groupId: string
  ): Array<{ resource: Resource; actions: AuthAction[] }> => {
    const group = getPermissionGroup(groupId);
    return group ? group.permissions : [];
  };

  /**
   * Get all available core roles
   */
  const getAvailableRoles = (): Role[] => {
    return coreRoles.map((r) => r.role);
  };

  return {
    permissionGroups,
    coreRoles,
    getRoleInfo,
    getPermissionGroup,
    getPermissionsFromGroup,
    getAvailableRoles,
    convertPermissionsToScopes,
    buildAuthorizationUrl,
  };
}
