import { computed } from 'vue';
import { useApiKeyAuthorization } from './useApiKeyAuthorization';
import type { Role } from '~/composables/gql/graphql';

export interface AuthorizationFormData {
  name: string;
  description: string;
  roles?: Role[];
  customPermissions?: Array<{
    resources: string[];
    actions: string[];
  }>;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Composable for converting URL authorization params to simple form data structure
 * The backend will handle the scope conversion when it generates the form schema
 */
export function useApiKeyAuthorizationForm(urlSearchParams?: URLSearchParams) {
  const {
    authParams,
    defaultKeyName,
  } = useApiKeyAuthorization(urlSearchParams);

  /**
   * Convert URL params to form data including parsed scopes
   */
  const convertScopesToFormData = computed((): AuthorizationFormData => {
    const { convertScopesToPermissions } = useApiKeyAuthorization();
    const scopeConversion = convertScopesToPermissions(authParams.value.scopes);
    
    return {
      name: defaultKeyName.value,
      description: authParams.value.description,
      roles: scopeConversion.roles,
      customPermissions: scopeConversion.permissions.map(perm => ({
        resources: [perm.resource],
        actions: perm.actions.map(action => 
          // Convert from enum format (CREATE) to form format (create:any)
          action.includes(':') ? action : `${action.toLowerCase()}:any`
        ),
      })),
    };
  });

  /**
   * Get the app name without the " API Key" suffix for display
   */
  const displayAppName = computed(() => {
    return authParams.value.name.replace(' API Key', '');
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
