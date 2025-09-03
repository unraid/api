import { AuthAction, Resource, Role } from '../graphql-enums.js';
import { convertScopesToPermissions } from './permissions.js';
import { describe, expect, it } from 'vitest';

describe('convertScopesToPermissions', () => {
  it('should correctly handle actions with colons like read:any', () => {
    const scopes = [
      'API_KEY:read:any',
      'DASHBOARD:create:own',
      'NETWORK:update:any'
    ];

    const result = convertScopesToPermissions(scopes);

    expect(result.permissions).toHaveLength(3);
    
    const apiKeyPerm = result.permissions.find(p => p.resource === Resource.API_KEY);
    expect(apiKeyPerm).toBeDefined();
    expect(apiKeyPerm?.actions).toContain(AuthAction.READ_ANY);
    
    const dashboardPerm = result.permissions.find(p => p.resource === Resource.DASHBOARD);
    expect(dashboardPerm).toBeDefined();
    expect(dashboardPerm?.actions).toContain(AuthAction.CREATE_OWN);
    
    const networkPerm = result.permissions.find(p => p.resource === Resource.NETWORK);
    expect(networkPerm).toBeDefined();
    expect(networkPerm?.actions).toContain(AuthAction.UPDATE_ANY);
  });

  it('should handle wildcard actions', () => {
    const scopes = ['DOCKER:*'];

    const result = convertScopesToPermissions(scopes);

    expect(result.permissions).toHaveLength(1);
    const dockerPerm = result.permissions[0];
    expect(dockerPerm.resource).toBe(Resource.DOCKER);
    expect(dockerPerm.actions).toContain(AuthAction.CREATE_ANY);
    expect(dockerPerm.actions).toContain(AuthAction.READ_ANY);
    expect(dockerPerm.actions).toContain(AuthAction.UPDATE_ANY);
    expect(dockerPerm.actions).toContain(AuthAction.DELETE_ANY);
  });

  it('should handle role scopes', () => {
    const scopes = ['role:ADMIN', 'role:VIEWER'];

    const result = convertScopesToPermissions(scopes);

    expect(result.roles).toHaveLength(2);
    expect(result.roles).toContain(Role.ADMIN);
    expect(result.roles).toContain(Role.VIEWER);
    expect(result.permissions).toHaveLength(0);
  });

  it('should merge permissions for the same resource', () => {
    const scopes = [
      'VMS:read:any',
      'VMS:update:any'
    ];

    const result = convertScopesToPermissions(scopes);

    expect(result.permissions).toHaveLength(1);
    const vmsPerm = result.permissions[0];
    expect(vmsPerm.resource).toBe(Resource.VMS);
    expect(vmsPerm.actions).toHaveLength(2);
    expect(vmsPerm.actions).toContain(AuthAction.READ_ANY);
    expect(vmsPerm.actions).toContain(AuthAction.UPDATE_ANY);
  });

  it('should handle invalid scope formats gracefully', () => {
    const scopes = [
      'INVALID_SCOPE',  // No colon
      ':action',        // Empty resource
      'RESOURCE:',      // Empty action
      'UNKNOWN:read:any' // Unknown resource
    ];

    const result = convertScopesToPermissions(scopes);

    expect(result.permissions).toHaveLength(0);
    expect(result.roles).toHaveLength(0);
  });
});