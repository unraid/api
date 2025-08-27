import { describe, it, expect } from 'vitest';
import { 
  parseActionToAuthAction,
  parseResourceToEnum,
  parseRoleToEnum,
  convertScopesToPermissions,
  convertPermissionsToScopes,
  normalizeLegacyAction
} from '../permissions.js';
import { AuthAction, Resource, Role } from '../../graphql-enums.js';

describe('permissions utilities', () => {
  describe('parseActionToAuthAction', () => {
    it('handles valid AuthAction enum values', () => {
      expect(parseActionToAuthAction('READ_ANY')).toBe(AuthAction.READ_ANY);
      expect(parseActionToAuthAction('CREATE_OWN')).toBe(AuthAction.CREATE_OWN);
      expect(parseActionToAuthAction('UPDATE_ANY')).toBe(AuthAction.UPDATE_ANY);
      expect(parseActionToAuthAction('DELETE_OWN')).toBe(AuthAction.DELETE_OWN);
    });

    it('handles legacy colon format', () => {
      expect(parseActionToAuthAction('read:any')).toBe(AuthAction.READ_ANY);
      expect(parseActionToAuthAction('create:own')).toBe(AuthAction.CREATE_OWN);
      expect(parseActionToAuthAction('update:any')).toBe(AuthAction.UPDATE_ANY);
      expect(parseActionToAuthAction('delete:own')).toBe(AuthAction.DELETE_OWN);
    });

    it('handles simple verbs with default possession', () => {
      expect(parseActionToAuthAction('read')).toBe(AuthAction.READ_ANY);
      expect(parseActionToAuthAction('create')).toBe(AuthAction.CREATE_ANY);
      expect(parseActionToAuthAction('update')).toBe(AuthAction.UPDATE_ANY);
      expect(parseActionToAuthAction('delete')).toBe(AuthAction.DELETE_ANY);
    });

    it('handles simple verbs with OWN as default', () => {
      expect(parseActionToAuthAction('read', 'OWN')).toBe(AuthAction.READ_OWN);
      expect(parseActionToAuthAction('create', 'OWN')).toBe(AuthAction.CREATE_OWN);
      expect(parseActionToAuthAction('update', 'OWN')).toBe(AuthAction.UPDATE_OWN);
      expect(parseActionToAuthAction('delete', 'OWN')).toBe(AuthAction.DELETE_OWN);
    });

    it('handles mixed case input', () => {
      expect(parseActionToAuthAction('Read')).toBe(AuthAction.READ_ANY);
      expect(parseActionToAuthAction('CREATE')).toBe(AuthAction.CREATE_ANY);
      expect(parseActionToAuthAction('Update:Any')).toBe(AuthAction.UPDATE_ANY);
      expect(parseActionToAuthAction('DELETE:OWN')).toBe(AuthAction.DELETE_OWN);
    });

    it('handles null and undefined', () => {
      expect(parseActionToAuthAction(null)).toBe(null);
      expect(parseActionToAuthAction(undefined)).toBe(null);
      expect(parseActionToAuthAction('')).toBe(null);
    });

    it('returns null for invalid actions', () => {
      expect(parseActionToAuthAction('invalid')).toBe(null);
      expect(parseActionToAuthAction('read:invalid')).toBe(null);
      expect(parseActionToAuthAction('invalid:any')).toBe(null);
    });

    it('ensures backward compatibility for old API keys', () => {
      // Old API keys might use these formats
      expect(parseActionToAuthAction('read')).toBe(AuthAction.READ_ANY);
      expect(parseActionToAuthAction('write')).toBe(null); // 'write' is not a valid verb
      expect(parseActionToAuthAction('create')).toBe(AuthAction.CREATE_ANY);
      expect(parseActionToAuthAction('update')).toBe(AuthAction.UPDATE_ANY);
      expect(parseActionToAuthAction('delete')).toBe(AuthAction.DELETE_ANY);
    });
  });

  describe('parseResourceToEnum', () => {
    it('parses valid resources', () => {
      expect(parseResourceToEnum('DOCKER')).toBe(Resource.DOCKER);
      expect(parseResourceToEnum('API_KEY')).toBe(Resource.API_KEY);
      expect(parseResourceToEnum('ARRAY')).toBe(Resource.ARRAY);
    });

    it('handles case insensitive input', () => {
      expect(parseResourceToEnum('docker')).toBe(Resource.DOCKER);
      expect(parseResourceToEnum('Docker')).toBe(Resource.DOCKER);
      expect(parseResourceToEnum('DOCKER')).toBe(Resource.DOCKER);
    });

    it('returns null for invalid resources', () => {
      expect(parseResourceToEnum('invalid')).toBe(null);
      expect(parseResourceToEnum('')).toBe(null);
    });
  });

  describe('parseRoleToEnum', () => {
    it('parses valid roles', () => {
      expect(parseRoleToEnum('ADMIN')).toBe(Role.ADMIN);
      expect(parseRoleToEnum('VIEWER')).toBe(Role.VIEWER);
      expect(parseRoleToEnum('CONNECT')).toBe(Role.CONNECT);
      expect(parseRoleToEnum('GUEST')).toBe(Role.GUEST);
    });

    it('handles case insensitive input', () => {
      expect(parseRoleToEnum('admin')).toBe(Role.ADMIN);
      expect(parseRoleToEnum('Admin')).toBe(Role.ADMIN);
      expect(parseRoleToEnum('ADMIN')).toBe(Role.ADMIN);
    });

    it('returns null for invalid roles', () => {
      expect(parseRoleToEnum('invalid')).toBe(null);
      expect(parseRoleToEnum('')).toBe(null);
    });
  });

  describe('convertScopesToPermissions', () => {
    it('converts role scopes', () => {
      const result = convertScopesToPermissions(['role:admin', 'role:viewer']);
      expect(result.roles).toEqual([Role.ADMIN, Role.VIEWER]);
      expect(result.permissions).toEqual([]);
    });

    it('converts permission scopes with actions', () => {
      const result = convertScopesToPermissions([
        'docker:read:any',
        'docker:update:any',
        'vms:create:own'
      ]);
      expect(result.roles).toEqual([]);
      expect(result.permissions).toHaveLength(2);
      
      const dockerPerm = result.permissions.find(p => p.resource === Resource.DOCKER);
      expect(dockerPerm?.actions).toContain(AuthAction.READ_ANY);
      expect(dockerPerm?.actions).toContain(AuthAction.UPDATE_ANY);
      
      const vmsPerm = result.permissions.find(p => p.resource === Resource.VMS);
      expect(vmsPerm?.actions).toEqual([AuthAction.CREATE_OWN]);
    });

    it('handles wildcard actions', () => {
      const result = convertScopesToPermissions(['docker:*']);
      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0].resource).toBe(Resource.DOCKER);
      expect(result.permissions[0].actions).toContain(AuthAction.CREATE_ANY);
      expect(result.permissions[0].actions).toContain(AuthAction.READ_ANY);
      expect(result.permissions[0].actions).toContain(AuthAction.UPDATE_ANY);
      expect(result.permissions[0].actions).toContain(AuthAction.DELETE_ANY);
    });

    it('merges permissions for same resource', () => {
      const result = convertScopesToPermissions([
        'docker:read:any',
        'docker:update:any'
      ]);
      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0].resource).toBe(Resource.DOCKER);
      expect(result.permissions[0].actions).toHaveLength(2);
      expect(result.permissions[0].actions).toContain(AuthAction.READ_ANY);
      expect(result.permissions[0].actions).toContain(AuthAction.UPDATE_ANY);
    });

    it('handles legacy simple verb format', () => {
      const result = convertScopesToPermissions([
        'docker:read',
        'vms:create',
        'array:update'
      ]);
      expect(result.permissions).toHaveLength(3);
      
      const dockerPerm = result.permissions.find(p => p.resource === Resource.DOCKER);
      expect(dockerPerm?.actions).toEqual([AuthAction.READ_ANY]);
      
      const vmsPerm = result.permissions.find(p => p.resource === Resource.VMS);
      expect(vmsPerm?.actions).toEqual([AuthAction.CREATE_ANY]);
      
      const arrayPerm = result.permissions.find(p => p.resource === Resource.ARRAY);
      expect(arrayPerm?.actions).toEqual([AuthAction.UPDATE_ANY]);
    });
  });

  describe('convertPermissionsToScopes', () => {
    it('converts roles to scopes', () => {
      const scopes = convertPermissionsToScopes([], [Role.ADMIN, Role.VIEWER]);
      expect(scopes).toContain('role:admin');
      expect(scopes).toContain('role:viewer');
    });

    it('converts permissions to scopes', () => {
      const scopes = convertPermissionsToScopes([
        {
          resource: Resource.DOCKER,
          actions: [AuthAction.READ_ANY, AuthAction.UPDATE_ANY]
        },
        {
          resource: Resource.VMS,
          actions: [AuthAction.CREATE_OWN]
        }
      ]);
      expect(scopes).toContain('docker:read_any');
      expect(scopes).toContain('docker:update_any');
      expect(scopes).toContain('vms:create_own');
    });
  });

  describe('normalizeLegacyAction', () => {
    it('handles simple verbs', () => {
      expect(normalizeLegacyAction('create')).toBe(AuthAction.CREATE_ANY);
      expect(normalizeLegacyAction('read')).toBe(AuthAction.READ_ANY);
      expect(normalizeLegacyAction('update')).toBe(AuthAction.UPDATE_ANY);
      expect(normalizeLegacyAction('delete')).toBe(AuthAction.DELETE_ANY);
    });

    it('handles uppercase with underscore', () => {
      expect(normalizeLegacyAction('CREATE_ANY')).toBe(AuthAction.CREATE_ANY);
      expect(normalizeLegacyAction('READ_OWN')).toBe(AuthAction.READ_OWN);
    });

    it('handles lowercase with colon', () => {
      expect(normalizeLegacyAction('create:any')).toBe(AuthAction.CREATE_ANY);
      expect(normalizeLegacyAction('read:own')).toBe(AuthAction.READ_OWN);
    });

    it('returns null for invalid actions', () => {
      expect(normalizeLegacyAction('invalid')).toBe(null);
    });
  });
});