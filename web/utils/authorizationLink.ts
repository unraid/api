import type { Role, AuthAction } from '~/composables/gql/graphql.js';
import { roleToScope, permissionToScope } from '~/composables/useApiKeyScopeGroups.js';

interface RawPermission {
  resource: string;
  actions: AuthAction[];
}

export interface AuthorizationLinkParams {
  appName: string;
  appDescription?: string;
  roles?: Role[];
  rawPermissions?: RawPermission[];
  redirectUrl?: string;
}

/**
 * Extract just the action verb from an AuthAction enum or formatted string
 * E.g., CREATE_ANY -> create, read:any -> read
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
 * Generate scopes array from roles and permissions for API key authorization
 * Uses shared utility functions for consistent scope generation
 */
export function generateScopes(roles: Role[] = [], rawPermissions: RawPermission[] = []): string[] {
  const scopes: string[] = [];
  
  // Add role scopes using shared utility
  for (const role of roles) {
    scopes.push(roleToScope(role));
  }
  
  // Add permission scopes using shared utility
  for (const perm of rawPermissions) {
    for (const action of perm.actions) {
      // Convert AuthAction enum to simple form (CREATE_ANY -> create)
      const simpleAction = extractActionVerb(action);
      scopes.push(permissionToScope(perm.resource, simpleAction));
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
    redirectUrl
  } = params;
  
  // Compute redirectUrl with SSR safety
  const computedRedirectUrl = redirectUrl || (
    typeof window !== 'undefined' 
      ? window.location.origin + '/api-key-created'
      : '/api-key-created'
  );
  
  const scopes = generateScopes(roles, rawPermissions);
  
  // Build URL parameters
  const urlParams = new URLSearchParams({
    name: appName,
    redirect_uri: computedRedirectUrl,
    scopes: scopes.join(','),
  });
  
  if (appDescription) {
    urlParams.set('description', appDescription);
  }
  
  // Use current origin for the authorization URL (Tools menu in WebGui) with SSR safety
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/Tools/ApiKeyAuthorize`
    : '/Tools/ApiKeyAuthorize';
  
  return `${baseUrl}?${urlParams.toString()}`;
}

