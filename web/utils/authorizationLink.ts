import type { Role } from '~/composables/gql/graphql';

interface RawPermission {
  resource: string;
  actions: string[];
}

export interface AuthorizationLinkParams {
  appName: string;
  appDescription?: string;
  roles?: Role[];
  rawPermissions?: RawPermission[];
  redirectUrl?: string;
}

/**
 * Generate scopes array from roles and permissions for API key authorization
 */
export function generateScopes(roles: Role[] = [], rawPermissions: RawPermission[] = []): string[] {
  const scopes: string[] = [];
  
  // Add role scopes
  for (const role of roles) {
    scopes.push(`role:${role.toLowerCase()}`);
  }
  
  // Add permission scopes
  for (const perm of rawPermissions) {
    for (const action of perm.actions) {
      scopes.push(`${perm.resource.toLowerCase()}:${action}`);
    }
  }
  
  return scopes;
}

/**
 * Generate a developer authorization URL for API key creation
 */
export function generateAuthorizationUrl(params: AuthorizationLinkParams): string {
  const {
    appName,
    appDescription,
    roles = [],
    rawPermissions = [],
    redirectUrl = window.location.origin + '/api-key-created'
  } = params;
  
  const scopes = generateScopes(roles, rawPermissions);
  
  // Build URL parameters
  const urlParams = new URLSearchParams({
    name: appName,
    redirect_uri: redirectUrl,
    scopes: scopes.join(','),
  });
  
  if (appDescription) {
    urlParams.set('description', appDescription);
  }
  
  // Use current origin for the authorization URL
  const baseUrl = `${window.location.origin}/apikeyauthorize`;
  
  return `${baseUrl}?${urlParams.toString()}`;
}

/**
 * Copy authorization URL to clipboard and show notification
 */
export async function copyAuthorizationUrl(params: AuthorizationLinkParams): Promise<boolean> {
  try {
    const url = generateAuthorizationUrl(params);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy authorization URL:', error);
    return false;
  }
}
