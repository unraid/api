import { computed } from 'vue';
import { useApiKeyAuthorization } from './useApiKeyAuthorization.js';
import type { Role, Resource, AuthAction } from '~/composables/gql/graphql.js';

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
 * Composable for converting URL authorization params to simple form data structure
 * The backend will handle the scope conversion when it generates the form schema
 */
export function useApiKeyAuthorizationForm(urlSearchParams?: URLSearchParams) {
  const {
    authParams,
    defaultKeyName,
    convertScopesToPermissions,
  } = useApiKeyAuthorization(urlSearchParams);

  /**
   * Convert URL params to form data including parsed scopes
   */
  const convertScopesToFormData = computed((): AuthorizationFormData => {
    const scopeConversion = convertScopesToPermissions(authParams.value.scopes);
    
    const formData = {
      name: defaultKeyName.value,
      description: authParams.value.description,
      roles: scopeConversion.roles,
      customPermissions: scopeConversion.permissions.map(perm => ({
        resources: [perm.resource],
        actions: perm.actions, // Pass AuthAction strings directly
      })),
    };
    
    return formData;
  });

  /**
   * Get the app name for display
   */
  const displayAppName = computed(() => {
    const name = authParams.value.name;
    // Remove " API Key" suffix for display if present
    if (name.endsWith(' API Key')) {
      return name.slice(0, -8); // Remove last 8 chars (" API Key")
    }
    return name;
  });

  /**
   * Check if the form data has any meaningful permissions
   */
  const hasPermissions = computed(() => {
    return authParams.value.scopes && authParams.value.scopes.length > 0;
  });

  /**
   * Get a summary of requested permissions for display
   */
  const permissionsSummary = computed(() => {
    const scopes = authParams.value.scopes;
    if (!scopes || scopes.length === 0) {
      return '';
    }

    const roleCount = scopes.filter(scope => scope.startsWith('role:')).length;
    const permissionCount = scopes.filter(scope => !scope.startsWith('role:')).length;
    
    const summary: string[] = [];
    if (roleCount > 0) {
      summary.push(`${roleCount} role(s)`);
    }
    if (permissionCount > 0) {
      summary.push(`${permissionCount} permission(s)`);
    }

    return summary.join(', ');
  });

  return {
    authParams,
    formData: convertScopesToFormData,
    displayAppName,
    hasPermissions,
    permissionsSummary,
    convertScopesToFormData,
  };
}
