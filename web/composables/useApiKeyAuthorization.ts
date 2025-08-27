import { computed, ref } from 'vue';
import { AuthAction, Resource, Role } from '~/composables/gql/graphql';

export interface ScopeConversion {
  permissions: Array<{ resource: Resource; actions: AuthAction[] }>;
  roles: Role[];
}

/**
 * Convert scope strings to permissions and roles
 * Scopes can be in format:
 * - "role:admin" for roles
 * - "docker:read" for resource permissions
 * - "docker:*" for all actions on a resource
 */
function convertScopesToPermissions(scopes: string[]): ScopeConversion {
  const permissions: Array<{ resource: Resource; actions: AuthAction[] }> = [];
  const roles: Role[] = [];
  
  for (const scope of scopes) {
    if (scope.startsWith('role:')) {
      // Handle role scope
      const roleStr = scope.substring(5).toUpperCase();
      if (Object.values(Role).includes(roleStr as Role)) {
        roles.push(roleStr as Role);
      } else {
        console.warn(`Unknown role in scope: ${scope}`);
      }
    } else {
      // Handle permission scope
      const [resourceStr, actionStr] = scope.split(':');
      if (resourceStr && actionStr) {
        const resourceUpper = resourceStr.toUpperCase();
        const resource = Object.values(Resource).find(r => r === resourceUpper) as Resource;
        
        if (!resource) {
          console.warn(`Unknown resource in scope: ${scope}`);
          continue;
        }
        
        // Handle wildcard or specific action
        let actions: AuthAction[];
        if (actionStr === '*') {
          // Wildcard means all CRUD actions
          actions = [
            AuthAction.CREATE_ANY,
            AuthAction.READ_ANY,
            AuthAction.UPDATE_ANY,
            AuthAction.DELETE_ANY
          ];
        } else {
          // Convert action string to AuthAction enum
          // Scopes come in as 'read', 'create', etc. - convert to 'READ_ANY', 'CREATE_ANY'
          const enumValue = `${actionStr.toUpperCase()}_ANY` as AuthAction;
          if (Object.values(AuthAction).includes(enumValue)) {
            actions = [enumValue];
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

export interface ApiKeyAuthorizationParams {
  name: string;
  description: string;
  scopes: string[];
  redirectUri: string;
  state: string;
}

export interface FormattedPermission {
  scope: string;
  name: string;
  description: string;
  isRole: boolean;
}


/**
 * Composable for handling API key authorization flow
 */
export function useApiKeyAuthorization(urlSearchParams?: URLSearchParams) {
  // Parse query parameters with SSR safety
  const params = urlSearchParams || (
    typeof window !== 'undefined' 
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams()
  );
  
  const authParams = ref<ApiKeyAuthorizationParams>({
    name: params.get('name') || 'Unknown Application',
    description: params.get('description') || '',
    scopes: (params.get('scopes') || '').split(',').filter(Boolean),
    redirectUri: params.get('redirect_uri') || '',
    state: params.get('state') || '',
  });

  // Validate redirect URI - allow any valid URL including app URLs and custom schemes
  const isValidRedirectUri = (uri: string): boolean => {
    if (!uri) return false;
    try {
      // Just check if it's a valid URL format, don't restrict protocols or hosts
      new URL(uri);
      return true;
    } catch {
      return false;
    }
  };

  // Format scopes for display
  const formatPermissions = (scopes: string[]): FormattedPermission[] => {
    return scopes.map(scope => {
      if (scope.startsWith('role:')) {
        const role = scope.substring(5);
        return {
          scope,
          name: role.toUpperCase(),
          description: `Grant ${role} role access`,
          isRole: true,
        };
      } else {
        const [resource, action] = scope.split(':');
        if (resource && action) {
          const resourceName = resource.charAt(0).toUpperCase() + resource.slice(1);
          const actionDesc = action === '*' 
            ? 'Full' 
            : action.charAt(0).toUpperCase() + action.slice(1);
          return {
            scope,
            name: `${resourceName} - ${actionDesc}`,
            description: `${actionDesc} access to ${resourceName}`,
            isRole: false,
          };
        }
      }
      return { 
        scope, 
        name: scope, 
        description: scope, 
        isRole: false 
      };
    });
  };

  // Use the shared convertScopesToFrontendFormPermissions function from @unraid/shared
  // This ensures consistent scope parsing across frontend and backend

  // Build redirect URL with API key or error
  const buildCallbackUrl = (
    redirectUri: string, 
    apiKey?: string, 
    error?: string, 
    state?: string
  ): string => {
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
  };

  // Computed properties
  const formattedPermissions = computed(() => 
    formatPermissions(authParams.value.scopes)
  );

  const hasValidRedirectUri = computed(() => 
    isValidRedirectUri(authParams.value.redirectUri)
  );

  const defaultKeyName = computed(() => authParams.value.name);

  return {
    authParams,
    formattedPermissions,
    hasValidRedirectUri,
    defaultKeyName,
    isValidRedirectUri,
    formatPermissions,
    convertScopesToPermissions,
    buildCallbackUrl,
  };
}
