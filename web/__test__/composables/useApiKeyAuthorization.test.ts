import { describe, it, expect } from 'vitest';
import { useApiKeyAuthorization } from '~/composables/useApiKeyAuthorization';
import { Resource, Role, AuthActionVerb } from '~/composables/gql/graphql';

describe('useApiKeyAuthorization', () => {
  describe('parameter parsing', () => {
    it('should parse query parameters correctly', () => {
      const params = new URLSearchParams('?name=TestApp&scopes=docker:read,vm:*&redirect_uri=https://example.com&state=abc123');
      const { authParams } = useApiKeyAuthorization(params);
      
      expect(authParams.value.name).toBe('TestApp');
      expect(authParams.value.scopes).toEqual(['docker:read', 'vm:*']);
      expect(authParams.value.redirectUri).toBe('https://example.com');
      expect(authParams.value.state).toBe('abc123');
    });

    it('should handle missing parameters with defaults', () => {
      const params = new URLSearchParams('');
      const { authParams } = useApiKeyAuthorization(params);
      
      expect(authParams.value.name).toBe('Unknown Application');
      expect(authParams.value.scopes).toEqual([]);
      expect(authParams.value.redirectUri).toBe('');
      expect(authParams.value.state).toBe('');
    });
  });

  describe('formatPermissions', () => {
    it('should format role scopes correctly', () => {
      const params = new URLSearchParams('?scopes=role:admin,role:viewer');
      const { formattedPermissions } = useApiKeyAuthorization(params);
      
      expect(formattedPermissions.value).toEqual([
        {
          scope: 'role:admin',
          name: 'ADMIN',
          description: 'Grant admin role access',
          isRole: true,
        },
        {
          scope: 'role:viewer',
          name: 'VIEWER',
          description: 'Grant viewer role access',
          isRole: true,
        },
      ]);
    });

    it('should format resource:action scopes correctly', () => {
      const params = new URLSearchParams('?scopes=docker:read,vm:*');
      const { formattedPermissions } = useApiKeyAuthorization(params);
      
      expect(formattedPermissions.value).toEqual([
        {
          scope: 'docker:read',
          name: 'Docker - Read',
          description: 'Read access to Docker',
          isRole: false,
        },
        {
          scope: 'vm:*',
          name: 'Vm - Full',
          description: 'Full access to Vm',
          isRole: false,
        },
      ]);
    });
  });

  describe('convertScopesToPermissions', () => {
    it('should convert role scopes to roles', () => {
      const params = new URLSearchParams('?scopes=role:admin');
      const { convertScopesToPermissions } = useApiKeyAuthorization(params);
      const result = convertScopesToPermissions(['role:admin']);
      
      expect(result.roles).toContain(Role.ADMIN);
      expect(result.permissions).toEqual([]);
    });

    it('should convert resource scopes to permissions', () => {
      const params = new URLSearchParams('?scopes=docker:read');
      const { convertScopesToPermissions } = useApiKeyAuthorization(params);
      const result = convertScopesToPermissions(['docker:read']);
      
      expect(result.permissions).toEqual([
        {
          resource: Resource.DOCKER,
          actions: [AuthActionVerb.READ],
        },
      ]);
      expect(result.roles).toEqual([]);
    });

    it('should handle wildcard actions', () => {
      const params = new URLSearchParams('?scopes=vm:*');
      const { convertScopesToPermissions } = useApiKeyAuthorization(params);
      const result = convertScopesToPermissions(['vm:*']);
      
      expect(result.permissions).toEqual([
        {
          resource: Resource.VMS,
          actions: [AuthActionVerb.CREATE, AuthActionVerb.READ, AuthActionVerb.UPDATE, AuthActionVerb.DELETE],
        },
      ]);
    });

    it('should merge multiple actions for same resource', () => {
      const params = new URLSearchParams('');
      const { convertScopesToPermissions } = useApiKeyAuthorization(params);
      const result = convertScopesToPermissions(['docker:read', 'docker:update']);
      
      expect(result.permissions).toEqual([
        {
          resource: Resource.DOCKER,
          actions: [AuthActionVerb.READ, AuthActionVerb.UPDATE],
        },
      ]);
    });
  });

  describe('redirect URI validation', () => {
    it('should accept HTTPS URLs', () => {
      const params = new URLSearchParams('?redirect_uri=https://example.com/callback');
      const { hasValidRedirectUri } = useApiKeyAuthorization(params);
      
      expect(hasValidRedirectUri.value).toBe(true);
    });

    it('should accept localhost URLs', () => {
      const params = new URLSearchParams('?redirect_uri=http://localhost:3000/callback');
      const { hasValidRedirectUri } = useApiKeyAuthorization(params);
      
      expect(hasValidRedirectUri.value).toBe(true);
    });

    it('should reject HTTP URLs (non-localhost)', () => {
      const params = new URLSearchParams('?redirect_uri=http://example.com/callback');
      const { hasValidRedirectUri } = useApiKeyAuthorization(params);
      
      expect(hasValidRedirectUri.value).toBe(false);
    });

    it('should reject invalid URLs', () => {
      const params = new URLSearchParams('?redirect_uri=not-a-url');
      const { hasValidRedirectUri } = useApiKeyAuthorization(params);
      
      expect(hasValidRedirectUri.value).toBe(false);
    });
  });

  describe('buildCallbackUrl', () => {
    it('should build callback URL with API key', () => {
      const params = new URLSearchParams('');
      const { buildCallbackUrl } = useApiKeyAuthorization(params);
      const url = buildCallbackUrl('https://example.com/callback', 'test-key', undefined, 'state123');
      
      expect(url).toBe('https://example.com/callback?api_key=test-key&state=state123');
    });

    it('should build callback URL with error', () => {
      const params = new URLSearchParams('');
      const { buildCallbackUrl } = useApiKeyAuthorization(params);
      const url = buildCallbackUrl('https://example.com/callback', undefined, 'access_denied', 'state123');
      
      expect(url).toBe('https://example.com/callback?error=access_denied&state=state123');
    });

    it('should throw for invalid redirect URI', () => {
      const params = new URLSearchParams('');
      const { buildCallbackUrl } = useApiKeyAuthorization(params);
      
      expect(() => buildCallbackUrl('not-a-url', 'key')).toThrow('Invalid redirect URI');
    });
  });
});
