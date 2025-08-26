// Import from graphql-enums to avoid NestJS dependencies
import { Resource, Role, AuthAction, AuthActionVerb, AuthPossession } from '../graphql-enums.js';

export interface ScopeConversion {
  permissions: Array<{ resource: Resource; actions: AuthAction[] }>;
  roles: Role[];
}

/**
 * Normalize an action string to AuthAction enum value
 * Handles various input formats:
 * - Full AuthAction values: 'READ_ANY', 'CREATE_OWN'
 * - Lowercase with colon: 'read:any', 'create:own' (legacy)
 * - Simple verbs: 'read', 'create' (defaults to '_ANY')
 * - Mixed case: 'Read', 'CREATE'
 * 
 * @param action - The action string to normalize
 * @param defaultPossession - Default possession if not specified ('ANY' or 'OWN')
 * @returns The normalized action as AuthAction or null if invalid
 */
export function parseActionToAuthAction(action: string | null | undefined, defaultPossession: 'ANY' | 'OWN' = 'ANY'): AuthAction | null {
  if (!action) return null;
  
  // First check if it's already a valid AuthAction value
  if (Object.values(AuthAction).includes(action as AuthAction)) {
    return action as AuthAction;
  }
  
  // Normalize the input - handle both underscore and colon formats
  let normalized = action.trim().toUpperCase();
  
  // Convert colon format (read:any) to underscore format (READ_ANY)
  if (normalized.includes(':')) {
    normalized = normalized.replace(':', '_');
  }
  
  // Check if normalized version is valid
  if (Object.values(AuthAction).includes(normalized as AuthAction)) {
    return normalized as AuthAction;
  }
  
  // Handle simple verbs without possession
  const simpleVerbs = ['CREATE', 'READ', 'UPDATE', 'DELETE'];
  const verb = normalized.split('_')[0];
  
  if (simpleVerbs.includes(verb)) {
    const withPossession = `${verb}_${defaultPossession}` as AuthAction;
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
 * @returns The verb part of the action as AuthActionVerb or null if invalid
 */
export function getVerbFromAuthAction(action: AuthAction): AuthActionVerb | null {
  // AuthAction is now in format CREATE_ANY, so split by underscore
  const verb = action.split('_')[0];
  
  // Match against actual enum values
  if (Object.values(AuthActionVerb).includes(verb as AuthActionVerb)) {
    return verb as AuthActionVerb;
  }
  return null;
}

/**
 * Extract the possession from an AuthAction
 * @param action - The AuthAction to extract from
 * @returns The possession part of the action as AuthPossession or null if invalid
 */
export function getPossessionFromAuthAction(action: AuthAction): AuthPossession | null {
  // AuthAction is now in format CREATE_ANY, so split by underscore
  const possession = action.split('_')[1];
  
  // Match against actual enum values
  if (Object.values(AuthPossession).includes(possession as AuthPossession)) {
    return possession as AuthPossession;
  }
  return null;
}

/**
 * Combine a verb and possession into an AuthAction
 * @param verb - The action verb (can be uppercase or lowercase)
 * @param possession - The possession type (can be uppercase or lowercase)
 * @returns The combined AuthAction or null if invalid
 */
export function combineToAuthAction(verb: string, possession: string): AuthAction | null {
  const combined = `${verb.toUpperCase()}_${possession.toUpperCase()}` as AuthAction;
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
      // Handle permission scope - split only on first colon
      const colonIndex = scope.indexOf(':');
      if (colonIndex === -1) {
        console.warn(`Invalid scope format (missing colon): ${scope}`);
        continue;
      }
      
      const resourceStr = scope.substring(0, colonIndex);
      const actionStr = scope.substring(colonIndex + 1).trim();
      
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
          // Actions like "read:any" should be preserved as-is
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
      } else {
        console.warn(`Invalid scope format: ${scope}`);
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
 * Normalize an action string to AuthAction format
 * @param action - The action string to normalize
 * @returns The normalized AuthAction or null if parsing fails
 */
export function normalizeAction(action: string): AuthAction | null {
  return parseActionToAuthAction(action);
}

/**
 * Normalize legacy action formats to AuthAction enum values
 * Handles multiple formats:
 * - Simple verbs: "create", "read", "update", "delete" -> AuthAction.CREATE_ANY, etc.
 * - Uppercase with underscore: "CREATE_ANY", "READ_ANY" -> AuthAction.CREATE_ANY, etc.
 * - Already correct: "create:any", "read:any" -> AuthAction.CREATE_ANY, etc.
 * 
 * @param action - The action string to normalize
 * @returns The normalized AuthAction enum value or null if invalid
 */
export function normalizeLegacyAction(action: string): AuthAction | null {
  const actionLower = action.toLowerCase();
  let normalizedString: string;
  
  // If it's already in lowercase:colon format, use it
  if (actionLower.includes(':')) {
    normalizedString = actionLower;
  }
  // If it's in uppercase_underscore format, convert to lowercase:colon
  else if (action.includes('_')) {
    normalizedString = actionLower.replace('_', ':');
  }
  // If it's a simple verb without possession, add ":any" as default
  else if (['create', 'read', 'update', 'delete'].includes(actionLower)) {
    normalizedString = `${actionLower}:any`;
  }
  // Otherwise just use lowercase (for unknown actions)
  else {
    normalizedString = actionLower;
  }
  
  // Convert the normalized string to AuthAction enum
  return parseActionToAuthAction(normalizedString);
}

/**
 * Normalize an array of legacy action strings to AuthAction enum values
 * Filters out any invalid actions that can't be normalized
 * 
 * @param actions - Array of action strings in various formats
 * @returns Array of valid AuthAction enum values
 */
export function normalizeLegacyActions(actions: string[]): AuthAction[] {
  return actions
    .map(action => normalizeLegacyAction(action))
    .filter((action): action is AuthAction => action !== null);
}

/**
 * Expand wildcard action (*) to all CRUD actions
 * @returns Array of all CRUD AuthAction values
 */
export function expandWildcardAction(): AuthAction[] {
  return [AuthAction.CREATE_ANY, AuthAction.READ_ANY, AuthAction.UPDATE_ANY, AuthAction.DELETE_ANY];
}

/**
 * Reconcile wildcard permissions by expanding them to all resources
 * @param permissionsWithSets - Map of resources to action sets, may include wildcard resource
 */
export function reconcileWildcardPermissions(permissionsWithSets: Map<Resource | '*', Set<AuthAction>>): void {
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
 * Merge permissions from source map into target map
 * @param targetMap - Map to merge permissions into
 * @param sourceMap - Map to merge permissions from
 */
export function mergePermissionsIntoMap(
  targetMap: Map<Resource, Set<AuthAction>>,
  sourceMap: Map<Resource, AuthAction[]>
): void {
  for (const [resource, actions] of sourceMap) {
    if (!targetMap.has(resource)) {
      targetMap.set(resource, new Set());
    }
    const actionsSet = targetMap.get(resource)!;
    actions.forEach((action) => actionsSet.add(action));
  }
}

/**
 * Convert permission sets to arrays, filtering out wildcards
 * @param permissionsWithSets - Map of resources to action sets
 * @returns Map of resources to action arrays (excludes wildcard resource)
 */
export function convertPermissionSetsToArrays(
  permissionsWithSets: Map<Resource | '*', Set<AuthAction>>
): Map<Resource, AuthAction[]> {
  const result = new Map<Resource, AuthAction[]>();

  for (const [resource, actionsSet] of permissionsWithSets) {
    if (resource !== '*') {
      result.set(resource as Resource, Array.from(actionsSet));
    }
  }

  return result;
}