import { AuthAction, Resource, Role } from '~/composables/gql/graphql.js';

export interface RawPermission {
  resource: string;
  actions: AuthAction[];
}

export interface AuthorizationLinkParams {
  appName: string;
  appDescription?: string;
  roles?: Role[];
  rawPermissions?: RawPermission[];
  redirectUrl?: string;
  state?: string;
}

export interface AuthorizationFormData {
  name: string;
  description: string;
  roles?: Role[];
  customPermissions?: Array<{
    resources: Resource[];
    actions: AuthAction[];
  }>;
}

/**
 * Convert AuthAction enum to simple action verb
 * E.g., CREATE_ANY -> create, READ_OWN -> read
 * @deprecated Use extractActionWithPossession for possession-aware extraction
 */
export function extractActionVerb(action: AuthAction | string): string {
  const actionStr = String(action);
  
  // Handle enum values like CREATE_ANY, READ_ANY
  if (actionStr.includes('_')) {
    return actionStr.split('_')[0].toLowerCase();
  }
  
  // Handle scope format like 'read:any'
  if (actionStr.includes(':')) {
    return actionStr.split(':')[0].toLowerCase();
  }
  
  // Already just a verb
  return actionStr.toLowerCase();
}

/**
 * Convert AuthAction enum to lowercase format with possession
 * E.g., CREATE_ANY -> create_any, READ_OWN -> read_own
 */
export function extractActionWithPossession(action: AuthAction | string): string {
  // Just convert the full enum value to lowercase
  return String(action).toLowerCase();
}

/**
 * Encode permissions into efficient scope strings
 * Groups resources with identical action sets using a compact format:
 * - Individual: "docker:read_any", "vms:update_own"  
 * - Grouped: "docker+vms:read_any+update_own" (resources sharing same actions)
 */
export function encodePermissionsToScopes(roles: Role[] = [], rawPermissions: RawPermission[] = []): string[] {
  const scopes: string[] = [];
  
  // Add role scopes
  for (const role of roles) {
    scopes.push(`role:${role.toLowerCase()}`);
  }
  
  // Skip empty permissions
  const validPermissions = rawPermissions.filter(perm => perm.actions && perm.actions.length > 0);
  
  // First, merge all permissions for the same resource
  const resourceActionsMap = new Map<string, Set<string>>();
  
  for (const perm of validPermissions) {
    const resourceName = perm.resource.toLowerCase();
    if (!resourceActionsMap.has(resourceName)) {
      resourceActionsMap.set(resourceName, new Set<string>());
    }
    
    const actionsSet = resourceActionsMap.get(resourceName)!;
    for (const action of perm.actions) {
      actionsSet.add(extractActionWithPossession(action));
    }
  }
  
  // Now group resources by their action sets for efficient encoding
  const actionGroups = new Map<string, Set<string>>();
  
  for (const [resourceName, actionsSet] of resourceActionsMap) {
    const actionsWithPossession = Array.from(actionsSet).sort();
    
    // Create a key from the sorted actions
    const actionKey = actionsWithPossession.join('+');
    
    if (!actionGroups.has(actionKey)) {
      actionGroups.set(actionKey, new Set<string>());
    }
    actionGroups.get(actionKey)!.add(resourceName);
  }
  
  // Generate efficient scopes
  for (const [actions, resourcesSet] of actionGroups.entries()) {
    // Convert Set to sorted array for consistent output
    const resources = Array.from(resourcesSet).sort();
    
    if (resources.length === 1) {
      // Single resource: "docker:read_any+update_own"
      scopes.push(`${resources[0]}:${actions}`);
    } else {
      // Multiple resources with same actions: "docker+vms:read_any+update_own"
      scopes.push(`${resources.join('+')}:${actions}`);
    }
  }
  
  return scopes;
}

/**
 * Decode scope strings back to permissions and roles
 * Supports both individual and grouped formats:
 * - "role:admin" -> role
 * - "docker:read_any" -> single permission with possession
 * - "docker+vms:read_any+update_own" -> multiple permissions with same actions
 * - "docker:*" -> wildcard (all CRUD actions)
 */
export function decodeScopesToPermissions(scopes: string[]): { 
  permissions: Array<{ resource: Resource; actions: AuthAction[] }>, 
  roles: Role[] 
} {
  const roles: Role[] = [];
  // Use a map to merge permissions for the same resource
  const resourcePermissions = new Map<Resource, Set<AuthAction>>();
  
  for (const scope of scopes) {
    if (!scope) continue;
    
    if (scope.startsWith('role:')) {
      // Handle role scope
      const roleStr = scope.substring(5).toUpperCase();
      if (Object.values(Role).includes(roleStr as Role)) {
        roles.push(roleStr as Role);
      }
    } else {
      // Handle permission scope (potentially grouped)
      const [resourcesPart, actionsPart] = scope.split(':');
      if (!resourcesPart || !actionsPart) continue;
      
      // Split grouped resources (docker+vms)
      const resourceNames = resourcesPart.split('+');
      
      // Parse actions
      let actions: AuthAction[];
      if (actionsPart === '*') {
        // Wildcard: all CRUD actions
        actions = [
          AuthAction.CREATE_ANY,
          AuthAction.READ_ANY,
          AuthAction.UPDATE_ANY,
          AuthAction.DELETE_ANY
        ];
      } else {
        // Split grouped actions (read_any+update_own)
        const actionParts = actionsPart.split('+');
        actions = actionParts
          .map(actionStr => {
            // Convert to AuthAction enum (e.g., "read_any" -> "READ_ANY")
            const enumValue = actionStr.toUpperCase() as AuthAction;
            return Object.values(AuthAction).includes(enumValue) ? enumValue : null;
          })
          .filter((action): action is AuthAction => action !== null);
      }
      
      // Add actions to each resource
      for (const resourceName of resourceNames) {
        const resourceUpper = resourceName.toUpperCase();
        const resource = Object.values(Resource).find(r => r === resourceUpper) as Resource;
        
        if (resource && actions.length > 0) {
          if (!resourcePermissions.has(resource)) {
            resourcePermissions.set(resource, new Set());
          }
          actions.forEach(action => resourcePermissions.get(resource)!.add(action));
        }
      }
    }
  }
  
  // Convert map to array of permissions
  const permissions = Array.from(resourcePermissions.entries()).map(([resource, actionsSet]) => ({
    resource,
    actions: Array.from(actionsSet)
  }));
  
  return { permissions, roles };
}

/**
 * Convert scopes to form data structure with grouped permissions
 */
export function scopesToFormData(scopes: string[], name: string, description: string = ''): AuthorizationFormData {
  const { permissions, roles } = decodeScopesToPermissions(scopes);
  
  // Group permissions by their action sets for the form
  const permissionGroups = new Map<string, { resources: Set<Resource>; actions: Set<AuthAction> }>();
  
  for (const perm of permissions) {
    // Create a key based on sorted actions to group resources
    const actionKey = [...perm.actions].sort().join(',');
    
    if (!permissionGroups.has(actionKey)) {
      permissionGroups.set(actionKey, {
        resources: new Set<Resource>(),
        actions: new Set<AuthAction>(perm.actions),
      });
    }
    
    permissionGroups.get(actionKey)!.resources.add(perm.resource);
  }
  
  // Convert to array format expected by form
  const customPermissions = Array.from(permissionGroups.values()).map(group => ({
    resources: Array.from(group.resources),
    actions: Array.from(group.actions),
  }));
  
  return {
    name,
    description,
    roles,
    customPermissions: customPermissions.length > 0 ? customPermissions : [],
  };
}

/**
 * Generate authorization URL from params
 */
export function generateAuthorizationUrl(params: AuthorizationLinkParams): string {
  const {
    appName,
    appDescription,
    roles = [],
    rawPermissions = [],
    redirectUrl,
    state
  } = params;
  
  // Compute redirectUrl with SSR safety
  const computedRedirectUrl = redirectUrl || (
    typeof window !== 'undefined' 
      ? window.location.origin + '/api-key-created'
      : '/api-key-created'
  );
  
  const scopes = encodePermissionsToScopes(roles, rawPermissions);
  
  // Build URL parameters
  const urlParams = new URLSearchParams({
    name: appName,
    redirect_uri: computedRedirectUrl,
    scopes: scopes.join(','),
  });
  
  if (appDescription) {
    urlParams.set('description', appDescription);
  }
  
  if (state) {
    urlParams.set('state', state);
  }
  
  // Use current origin for the authorization URL with SSR safety
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/Tools/ApiKeyAuthorize`
    : '/Tools/ApiKeyAuthorize';
  
  return `${baseUrl}?${urlParams.toString()}`;
}

/**
 * Build callback URL with API key or error
 */
export function buildCallbackUrl(
  redirectUri: string, 
  apiKey?: string, 
  error?: string, 
  state?: string
): string {
  try {
    const url = new URL(redirectUri);
    if (apiKey) {
      url.searchParams.set('api_key', apiKey);
    }
    if (error) {
      url.searchParams.set('error', error);
    }
    if (state) {
      url.searchParams.set('state', state);
    }
    return url.toString();
  } catch {
    throw new Error('Invalid redirect URI');
  }
}

// Alias for backward compatibility
export const generateScopes = encodePermissionsToScopes;
