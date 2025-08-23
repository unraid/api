import { describe, it, expect } from 'vitest';
import { useApiKeyAuthorizationForm } from '~/composables/useApiKeyAuthorizationForm.js';
import { AuthAction, Role } from '~/composables/gql/graphql.js';

// Mock window.location for the tests
Object.defineProperty(window, 'location', {
  value: {
    search: '',
  },
  writable: true,
});

describe('useApiKeyAuthorizationForm', () => {
  it('should convert role scopes to form data', () => {
    const params = new URLSearchParams({
      name: 'MyApp',
      description: 'My test application',
      scopes: 'role:admin,role:viewer',
      redirect_uri: 'https://example.com/callback',
    });

    const { formData, displayAppName, hasPermissions, permissionsSummary } = useApiKeyAuthorizationForm(params);

    expect(formData.value).toEqual({
      name: 'MyApp',
      description: 'My test application',
      roles: [Role.ADMIN, Role.VIEWER],
      customPermissions: [],
    });

    expect(displayAppName.value).toBe('MyApp');
    expect(hasPermissions.value).toBe(true);
    expect(permissionsSummary.value).toBe('2 role(s)');
  });

  it('should convert resource permission scopes to form data', () => {
    const params = new URLSearchParams({
      name: 'Docker Manager',
      scopes: 'docker:read,docker:update,vms:read',
    });

    const { formData, hasPermissions, permissionsSummary } = useApiKeyAuthorizationForm(params);

    expect(formData.value).toEqual({
      name: 'Docker Manager',
      description: '',
      roles: [],
      customPermissions: [
        { resources: ['DOCKER'], actions: [AuthAction.READ_ANY, AuthAction.UPDATE_ANY] },
        { resources: ['VMS'], actions: [AuthAction.READ_ANY] },
      ],
    });

    expect(hasPermissions.value).toBe(true);
    expect(permissionsSummary.value).toBe('3 permission(s)');
  });

  it('should handle mixed role and permission scopes', () => {
    const params = new URLSearchParams({
      name: 'Mixed Access App',
      scopes: 'role:admin,docker:read,vms:*',
    });

    const { formData, hasPermissions, permissionsSummary } = useApiKeyAuthorizationForm(params);

    expect(formData.value).toEqual({
      name: 'Mixed Access App',
      description: '',
      roles: [Role.ADMIN],
      customPermissions: [
        { resources: ['DOCKER'], actions: [AuthAction.READ_ANY] },
        { resources: ['VMS'], actions: [AuthAction.CREATE_ANY, AuthAction.READ_ANY, AuthAction.UPDATE_ANY, AuthAction.DELETE_ANY] },
      ],
    });

    expect(hasPermissions.value).toBe(true);
    expect(permissionsSummary.value).toBe('1 role(s), 2 permission(s)');
  });

  it('should handle wildcard permissions correctly', () => {
    const params = new URLSearchParams({
      name: 'Full Access App',
      scopes: 'docker:*',
    });

    const { hasPermissions, permissionsSummary } = useApiKeyAuthorizationForm(params);

    expect(hasPermissions.value).toBe(true);
    expect(permissionsSummary.value).toBe('1 permission(s)');
  });

  it('should handle empty scopes gracefully', () => {
    const params = new URLSearchParams({
      name: 'No Permissions App',
      scopes: '',
    });

    const { formData, hasPermissions, permissionsSummary } = useApiKeyAuthorizationForm(params);

    expect(formData.value).toEqual({
      name: 'No Permissions App',
      description: '',
      roles: [],
      customPermissions: [],
    });

    expect(hasPermissions.value).toBe(false);
    expect(permissionsSummary.value).toBe('');
  });

  it('should handle app names ending with " API Key"', () => {
    const params = new URLSearchParams({
      name: 'MyApp API Key',
      scopes: 'role:viewer',
    });

    const { formData, displayAppName } = useApiKeyAuthorizationForm(params);

    expect(displayAppName.value).toBe('MyApp');
    // Name should be used as-is without appending
    expect(formData.value.name).toBe('MyApp API Key');
  });

  it('should handle invalid scopes gracefully', () => {
    const params = new URLSearchParams({
      name: 'Invalid Scopes App',
      scopes: 'role:invalid_role,unknown_resource:read,docker:invalid_action',
    });

    const { hasPermissions, permissionsSummary } = useApiKeyAuthorizationForm(params);

    expect(hasPermissions.value).toBe(true); // Has scopes, even if invalid
    expect(permissionsSummary.value).toBe('1 role(s), 2 permission(s)');
  });

  it('should use default values when parameters are missing', () => {
    const params = new URLSearchParams(); // Empty params

    const { formData, displayAppName } = useApiKeyAuthorizationForm(params);

    expect(formData.value.name).toBe('Unknown Application');
    expect(displayAppName.value).toBe('Unknown Application');
  });
});
