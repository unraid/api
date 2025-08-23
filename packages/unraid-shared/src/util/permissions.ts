// Import from graphql-enums to avoid NestJS dependencies
import { Resource, Role, AuthAction } from '../graphql-enums.js';

export interface ScopeConversion {
  permissions: Array<{ resource: Resource; actions: AuthAction[] }>;
  roles: Role[];
}

/**
 * Normalize an action string to AuthAction enum value
 * Handles various input formats:
 * - Full AuthAction values: 'read:any', 'create:own'
 * - Uppercase with underscore: 'READ_ANY', 'CREATE_OWN'
 * - Simple verbs: 'read', 'create' (defaults to ':any')
 * - Mixed case: 'Read', 'CREATE'
 * 
 * @param action - The action string to normalize
 * @param defaultPossession - Default possession if not specified ('any' or 'own')
 * @returns The normalized action as AuthAction or null if invalid
 */
export function parseActionToAuthAction(action: string, defaultPossession: 'any' | 'own' = 'any'): AuthAction | null {
  if (!action) return null;
  
  const normalized = action.trim().toLowerCase().replace(/_/g, ':');
  
  // Direct enum value check
  if (Object.values(AuthAction).includes(normalized as AuthAction)) {
    return normalized as AuthAction;
  }
  
  // Check if it's already a full action with possession
  if (normalized.includes(':')) {
    const fullAction = normalized as AuthAction;
    if (Object.values(AuthAction).includes(fullAction)) {
      return fullAction;
    }
  }
  
  // Handle simple verbs without possession
  const simpleVerbs = ['create', 'read', 'update', 'delete'];
  const verb = normalized.split(':')[0];
  
  if (simpleVerbs.includes(verb)) {
    const withPossession = `${verb}:${defaultPossession}` as AuthAction;
    if (Object.values(AuthAction).includes(withPossession)) {
      return withPossession;
    }
  }
  
  return null;
}

/**
 * Convenience function to parse action to enum (alias for backward compatibility)
 * @deprecated Use parseActionToAuthAction instead
 */
export const parseActionToEnum = parseActionToAuthAction;

/**
 * Extract the verb from an AuthAction
 * @param action - The AuthAction to extract from
 * @returns The verb part of the action (create, read, update, delete)
 */
export function getVerbFromAuthAction(action: AuthAction): string {
  return action.split(':')[0];
}

/**
 * Extract the possession from an AuthAction
 * @param action - The AuthAction to extract from
 * @returns The possession part of the action (any, own)
 */
export function getPossessionFromAuthAction(action: AuthAction): 'any' | 'own' {
  const possession = action.split(':')[1];
  return possession as 'any' | 'own';
}

/**
 * Combine a verb and possession into an AuthAction
 * @param verb - The action verb
 * @param possession - The possession type
 * @returns The combined AuthAction or null if invalid
 */
export function combineToAuthAction(verb: string, possession: 'any' | 'own'): AuthAction | null {
  const combined = `${verb.toLowerCase()}:${possession}` as AuthAction;
  if (Object.values(AuthAction).includes(combined)) {
    return combined;
  }
  return null;
}

/**
 * Parse a resource string to Resource enum
 * Handles special cases and variations
 * 
 * @param resourceStr - The resource string to parse
 * @returns The Resource enum value or null if invalid
 */
export function parseResourceToEnum(resourceStr: string): Resource | null {
  const normalized = resourceStr.trim().toUpperCase();
  
  // Direct enum lookup
  const directMatch = Resource[normalized as keyof typeof Resource];
  if (directMatch) {
    return directMatch;
  }
  
  // Handle special cases
  const specialCases: Record<string, Resource> = {
    'VM': Resource.VMS,
    // Add more special cases as needed
  };
  
  if (specialCases[normalized]) {
    return specialCases[normalized];
  }
  
  return null;
}

/**
 * Parse a role string to Role enum
 * 
 * @param roleStr - The role string to parse
 * @returns The Role enum value or null if invalid
 */
export function parseRoleToEnum(roleStr: string): Role | null {
  const normalized = roleStr.trim().toUpperCase();
  const role = Role[normalized as keyof typeof Role];
  return role || null;
}

/**
 * Convert scope strings to permissions and roles
 * Scopes can be in format:
 * - "role:admin" for roles
 * - "docker:read" for resource permissions
 * - "docker:*" for all actions on a resource
 * 
 * @param scopes - Array of scope strings
 * @returns Object containing parsed permissions and roles
 */
export function convertScopesToPermissions(scopes: string[]): ScopeConversion {
  const permissions: Array<{ resource: Resource; actions: AuthAction[] }> = [];
  const roles: Role[] = [];
  
  for (const scope of scopes) {
    if (scope.startsWith('role:')) {
      // Handle role scope
      const roleStr = scope.substring(5);
      const role = parseRoleToEnum(roleStr);
      if (role) {
        roles.push(role);
      } else {
        console.warn(`Unknown role in scope: ${scope}`);
      }
    } else {
      // Handle permission scope
      const [resourceStr, actionStr] = scope.split(':');
      if (resourceStr && actionStr) {
        const resource = parseResourceToEnum(resourceStr);
        if (!resource) {
          console.warn(`Unknown resource in scope: ${scope}`);
          continue;
        }
        
        // Handle wildcard or specific action
        let actions: AuthAction[];
        if (actionStr === '*') {
          actions = [
            AuthAction.CREATE_ANY,
            AuthAction.READ_ANY,
            AuthAction.UPDATE_ANY,
            AuthAction.DELETE_ANY
          ];
        } else {
          const action = parseActionToAuthAction(actionStr);
          if (action) {
            actions = [action];
          } else {
            console.warn(`Unknown action in scope: ${scope}`);
            continue;
          }
        }
        
        // Merge with existing permissions for the same resource
        const existing = permissions.find(p => p.resource === resource);
        if (existing) {
          actions.forEach(a => {
            if (!existing.actions.includes(a)) {
              existing.actions.push(a);
            }
          });
        } else {
          permissions.push({ resource, actions });
        }
      }
    }
  }
  
  return { permissions, roles };
}

/**
 * Convert permissions and roles back to scope strings
 * Inverse of convertScopesToPermissions
 * 
 * @param permissions - Array of resource/action pairs
 * @param roles - Array of roles
 * @returns Array of scope strings
 */
export function convertPermissionsToScopes(
  permissions: Array<{ resource: Resource; actions: AuthAction[] }>,
  roles: Role[] = []
): string[] {
  const scopes: string[] = [];
  
  // Add role scopes
  for (const role of roles) {
    scopes.push(`role:${role.toLowerCase()}`);
  }
  
  // Add permission scopes
  for (const perm of permissions) {
    const resourceStr = perm.resource.toLowerCase();
    for (const action of perm.actions) {
      const actionStr = action.toLowerCase();
      scopes.push(`${resourceStr}:${actionStr}`);
    }
  }
  
  return scopes;
}

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

/**
 * Check if a scope string represents a role
 * @param scope - The scope string to check
 * @returns True if the scope is a role scope
 */
export function isRoleScope(scope: string): boolean {
  return scope.startsWith('role:');
}

/**
 * Extract the role from a role scope string
 * @param scope - The scope string like "role:admin"
 * @returns The role name or null if not a role scope
 */
export function getRoleFromScope(scope: string): string | null {
  if (!isRoleScope(scope)) return null;
  return scope.substring(5);
}

/**
 * Common CRUD action sets for convenience
 */
export const CRUD_ACTIONS = {
  ALL: [AuthAction.CREATE_ANY, AuthAction.READ_ANY, AuthAction.UPDATE_ANY, AuthAction.DELETE_ANY] as AuthAction[],
  ALL_OWN: [AuthAction.CREATE_OWN, AuthAction.READ_OWN, AuthAction.UPDATE_OWN, AuthAction.DELETE_OWN] as AuthAction[],
  READ_ONLY: [AuthAction.READ_ANY] as AuthAction[],
  READ_ONLY_OWN: [AuthAction.READ_OWN] as AuthAction[],
  CREATE_READ: [AuthAction.CREATE_ANY, AuthAction.READ_ANY] as AuthAction[],
  UPDATE_DELETE: [AuthAction.UPDATE_ANY, AuthAction.DELETE_ANY] as AuthAction[],
};

/**
 * Normalize an action string to AuthAction format
 * @param action - The action string to normalize
 * @returns The normalized action string or original if parsing fails
 */
export function normalizeAction(action: string): string {
  const parsed = parseActionToAuthAction(action);
  return parsed || action; // Return original if parsing fails
}

/**
 * Expand wildcard action (*) to all CRUD actions
 * @returns Array of all CRUD AuthAction values
 */
export function expandWildcardAction(): string[] {
  return [AuthAction.CREATE_ANY, AuthAction.READ_ANY, AuthAction.UPDATE_ANY, AuthAction.DELETE_ANY];
}

/**
 * Reconcile wildcard permissions by expanding them to all resources
 * @param permissionsWithSets - Map of resources to action sets, may include wildcard resource
 */
export function reconcileWildcardPermissions(permissionsWithSets: Map<Resource | '*', Set<string>>): void {
  if (permissionsWithSets.has('*' as Resource | '*')) {
    const wildcardActions = permissionsWithSets.get('*' as Resource | '*')!;
    permissionsWithSets.delete('*' as Resource | '*');

    // Apply wildcard actions to ALL resources (not just existing ones)
    for (const resource of Object.values(Resource)) {
      if (!permissionsWithSets.has(resource)) {
        permissionsWithSets.set(resource, new Set());
      }
      const actionsSet = permissionsWithSets.get(resource)!;
      wildcardActions.forEach((action) => actionsSet.add(action));
    }
  }
}

/**
 * Convert permission sets to arrays, filtering out wildcards
 * @param permissionsWithSets - Map of resources to action sets
 * @returns Map of resources to action arrays (excludes wildcard resource)
 */
export function convertPermissionSetsToArrays(
  permissionsWithSets: Map<Resource | '*', Set<string>>
): Map<Resource, string[]> {
  const result = new Map<Resource, string[]>();

  for (const [resource, actionsSet] of permissionsWithSets) {
    if (resource !== '*') {
      result.set(resource as Resource, Array.from(actionsSet));
    }
  }

  return result;
}