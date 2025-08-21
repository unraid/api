import { Resource, Role, AuthActionVerb } from '~/composables/gql/graphql';

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  icon?: string;
  permissions: Array<{
    resource: Resource;
    actions: AuthActionVerb[];
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
      { resource: Resource.DOCKER, actions: [AuthActionVerb.CREATE, AuthActionVerb.READ, AuthActionVerb.UPDATE, AuthActionVerb.DELETE] },
      { resource: Resource.ARRAY, actions: [AuthActionVerb.READ] },
      { resource: Resource.DISK, actions: [AuthActionVerb.READ] },
      { resource: Resource.NETWORK, actions: [AuthActionVerb.READ] },
    ],
  },
  {
    id: 'vm_manager',
    name: 'VM Manager',
    description: 'Full access to virtual machines',
    icon: 'computer',
    permissions: [
      { resource: Resource.VMS, actions: [AuthActionVerb.CREATE, AuthActionVerb.READ, AuthActionVerb.UPDATE, AuthActionVerb.DELETE] },
      { resource: Resource.ARRAY, actions: [AuthActionVerb.READ] },
      { resource: Resource.DISK, actions: [AuthActionVerb.READ] },
      { resource: Resource.NETWORK, actions: [AuthActionVerb.READ] },
    ],
  },
  {
    id: 'backup_manager',
    name: 'Backup Manager',
    description: 'Access to manage backups and flash storage',
    icon: 'archive',
    permissions: [
      { resource: Resource.FLASH, actions: [AuthActionVerb.CREATE, AuthActionVerb.READ, AuthActionVerb.UPDATE, AuthActionVerb.DELETE] },
      { resource: Resource.ARRAY, actions: [AuthActionVerb.READ] },
      { resource: Resource.DISK, actions: [AuthActionVerb.READ] },
      { resource: Resource.SHARE, actions: [AuthActionVerb.READ] },
    ],
  },
  {
    id: 'network_admin',
    name: 'Network Admin',
    description: 'Full network configuration access',
    icon: 'network',
    permissions: [
      { resource: Resource.NETWORK, actions: [AuthActionVerb.CREATE, AuthActionVerb.READ, AuthActionVerb.UPDATE, AuthActionVerb.DELETE] },
      { resource: Resource.SERVICES, actions: [AuthActionVerb.CREATE, AuthActionVerb.READ, AuthActionVerb.UPDATE, AuthActionVerb.DELETE] },
    ],
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    description: 'Read-only access for monitoring and dashboards',
    icon: 'chart-bar',
    permissions: [
      { resource: Resource.DOCKER, actions: [AuthActionVerb.READ] },
      { resource: Resource.VMS, actions: [AuthActionVerb.READ] },
      { resource: Resource.ARRAY, actions: [AuthActionVerb.READ] },
      { resource: Resource.DISK, actions: [AuthActionVerb.READ] },
      { resource: Resource.NETWORK, actions: [AuthActionVerb.READ] },
      { resource: Resource.INFO, actions: [AuthActionVerb.READ] },
      { resource: Resource.DASHBOARD, actions: [AuthActionVerb.READ] },
      { resource: Resource.LOGS, actions: [AuthActionVerb.READ] },
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
  permissions: Array<{ resource: Resource; actions: AuthActionVerb[] }>,
  roles: Role[]
): string[] {
  const scopes: string[] = [];

  // Convert permissions to scopes
  for (const perm of permissions) {
    const resource = perm.resource.toLowerCase();
    
    // Check if all CRUD actions are selected (means wildcard)
    const hasAllActions = 
      perm.actions.includes(AuthActionVerb.CREATE) &&
      perm.actions.includes(AuthActionVerb.READ) &&
      perm.actions.includes(AuthActionVerb.UPDATE) &&
      perm.actions.includes(AuthActionVerb.DELETE);
    
    if (hasAllActions) {
      scopes.push(`${resource}:*`);
    } else {
      // Add individual action scopes
      for (const action of perm.actions) {
        // Convert AuthActionVerb enum to lowercase string
        const actionStr = action.toLowerCase();
        scopes.push(`${resource}:${actionStr}`);
      }
    }
  }

  // Convert roles to scopes
  for (const role of roles) {
    scopes.push(`role:${role.toLowerCase()}`);
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
    return coreRoles.find(r => r.role === role);
  };

  /**
   * Get permission group by ID
   */
  const getPermissionGroup = (id: string): PermissionGroup | undefined => {
    return permissionGroups.find(g => g.id === id);
  };

  /**
   * Convert permission group to explicit permissions
   */
  const getPermissionsFromGroup = (groupId: string): Array<{ resource: Resource; actions: AuthActionVerb[] }> => {
    const group = getPermissionGroup(groupId);
    return group ? group.permissions : [];
  };

  /**
   * Get all available core roles
   */
  const getAvailableRoles = (): Role[] => {
    return coreRoles.map(r => r.role);
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
