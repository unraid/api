import { computed, ref } from 'vue';
import { 
  decodeScopesToPermissions, 
  scopesToFormData,
  buildCallbackUrl as buildUrl,
  generateAuthorizationUrl as generateUrl
} from '~/utils/authorizationScopes';

export interface ApiKeyAuthorizationParams {
  name: string;
  description: string;
  scopes: string[];
  redirectUri: string;
  state: string;
}

/**
 * Composable for authorization link handling with reactive state
 */
export function useAuthorizationLink(urlSearchParams?: URLSearchParams) {
  // Parse query parameters with SSR safety
  const params = urlSearchParams || (
    typeof window !== 'undefined' 
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams()
  );
  
  // Parse authorization parameters from URL
  const authParams = ref<ApiKeyAuthorizationParams>({
    name: params.get('name') || 'Unknown Application',
    description: params.get('description') || '',
    scopes: (params.get('scopes') || '').split(',').filter(Boolean),
    redirectUri: params.get('redirect_uri') || '',
    state: params.get('state') || '',
  });

  // Convert to form data structure with grouped permissions
  const formData = computed(() => {
    return scopesToFormData(
      authParams.value.scopes,
      authParams.value.name,
      authParams.value.description
    );
  });

  // Decode scopes to permissions and roles
  const decodedPermissions = computed(() => {
    return decodeScopesToPermissions(authParams.value.scopes);
  });

  // Validate redirect URI
  const hasValidRedirectUri = computed(() => {
    const uri = authParams.value.redirectUri;
    if (!uri) return false;
    try {
      new URL(uri);
      return true;
    } catch {
      return false;
    }
  });

  // Get display name (remove " API Key" suffix if present)
  const displayAppName = computed(() => {
    const name = authParams.value.name;
    if (name.endsWith(' API Key')) {
      return name.slice(0, -8);
    }
    return name;
  });

  // Check if there are any permissions
  const hasPermissions = computed(() => {
    return authParams.value.scopes && authParams.value.scopes.length > 0;
  });

  // Get permissions summary for display
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

  // Wrapper functions that use the reactive state
  const buildCallbackUrl = (apiKey?: string, error?: string) => {
    return buildUrl(authParams.value.redirectUri, apiKey, error, authParams.value.state);
  };

  const generateAuthorizationUrl = generateUrl;

  return {
    // Parsed params
    authParams,
    
    // Decoded data
    decodedPermissions,
    formData,
    
    // Display helpers
    displayAppName,
    hasPermissions,
    permissionsSummary,
    hasValidRedirectUri,
    
    // URL generation functions
    generateAuthorizationUrl,
    buildCallbackUrl,
  };
}
