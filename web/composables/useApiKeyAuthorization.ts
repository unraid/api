import { computed, ref } from 'vue';
import { Resource, Role, AuthActionVerb } from '~/composables/gql/graphql';

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

export interface ScopeConversion {
  permissions: Array<{ resource: Resource; actions: AuthActionVerb[] }>;
  roles: Role[];
}

/**
 * Composable for handling API key authorization flow
 */
export function useApiKeyAuthorization(urlSearchParams?: URLSearchParams) {
  // Parse query parameters
  const params = urlSearchParams || new URLSearchParams(window.location.search);
  
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

  // Convert scopes to permissions and roles for API key creation
  const convertScopesToPermissions = (scopes: string[]): ScopeConversion => {
    const permissions: Array<{ resource: Resource; actions: AuthActionVerb[] }> = [];
    const roles: Role[] = [];
    
    for (const scope of scopes) {
      if (scope.startsWith('role:')) {
        const roleStr = scope.substring(5).toUpperCase();
        const role = Role[roleStr as keyof typeof Role];
        if (role) {
          roles.push(role);
        } else {
          console.warn(`Unknown role: ${roleStr}`);
        }
      } else {
        const [resourceStr, actionStr] = scope.split(':');
        if (resourceStr && actionStr) {
          // Try direct enum lookup first (most resources match their enum name)
          let resource = Resource[resourceStr.toUpperCase() as keyof typeof Resource];
          
          // Handle special cases
          if (!resource) {
            // Special case: 'vm' and 'vms' both map to VMS
            if (resourceStr.toLowerCase() === 'vm') {
              resource = Resource.VMS;
            }
          }
          
          if (!resource) {
            console.warn(`Unknown resource: ${resourceStr}`);
            continue;
          }
          
          // Convert action strings to AuthActionVerb enum values
          let actions: AuthActionVerb[];
          if (actionStr === '*') {
            actions = [
              AuthActionVerb.CREATE,
              AuthActionVerb.READ,
              AuthActionVerb.UPDATE,
              AuthActionVerb.DELETE
            ];
          } else {
            const action = AuthActionVerb[actionStr.toUpperCase() as keyof typeof AuthActionVerb];
            if (action) {
              actions = [action];
            } else {
              console.warn(`Unknown action: ${actionStr}`);
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
  };

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
