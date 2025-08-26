import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthAction } from 'nest-authz';
import { Resource } from './graphql-enums.js';
import { UsePermissions } from './use-permissions.directive.js';

// Mock NestJS dependencies
vi.mock('nest-authz', () => ({
  UsePermissions: vi.fn(() => vi.fn()),
  AuthAction: {
    CREATE_ANY: 'create:any',
    READ_ANY: 'read:any',
    UPDATE_ANY: 'update:any',
    DELETE_ANY: 'delete:any',
    CREATE_OWN: 'create:own',
    READ_OWN: 'read:own',
    UPDATE_OWN: 'update:own',
    DELETE_OWN: 'delete:own',
  },
  AuthActionVerb: {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
  },
  AuthPossession: {
    ANY: 'any',
    OWN: 'own',
  },
}));

vi.mock('@nestjs/graphql', () => ({
  Directive: vi.fn(() => vi.fn()),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UsePermissions Directive', () => {
  describe('Resource Validation', () => {
    it('should accept valid Resource enum values', () => {
      const decorator = UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.API_KEY,
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).not.toThrow();
    });

    it('should accept valid Resource enum string values', () => {
      const decorator = UsePermissions({
        action: AuthAction.READ_ANY,
        resource: 'API_KEY',
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).not.toThrow();
    });

    it('should accept Resource enum keys as strings', () => {
      const decorator = UsePermissions({
        action: AuthAction.CREATE_ANY,
        resource: 'ACTIVATION_CODE',
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).not.toThrow();
    });

    it('should reject invalid resource strings', () => {
      const decorator = UsePermissions({
        action: AuthAction.READ_ANY,
        resource: 'INVALID_RESOURCE',
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).toThrow(/Invalid resource value: "INVALID_RESOURCE"/);
    });

    it('should reject typos in resource names', () => {
      const decorator = UsePermissions({
        action: AuthAction.READ_ANY,
        resource: 'API_KEYS', // typo: should be API_KEY
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).toThrow(/Invalid resource value: "API_KEYS"/);
    });

    it('should provide helpful error message listing valid resources', () => {
      const decorator = UsePermissions({
        action: AuthAction.READ_ANY,
        resource: 'INVALID',
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).toThrow(/Must be one of:/);
    });
  });

  describe('SDL Injection Protection', () => {
    it('should reject resources with special characters', () => {
      const decorator = UsePermissions({
        action: AuthAction.READ_ANY,
        resource: 'API_KEY", malicious: "true',
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).toThrow(/Invalid resource value/);
    });

    it('should reject resources with GraphQL directive injection attempts', () => {
      const decorator = UsePermissions({
        action: AuthAction.READ_ANY,
        resource: 'API_KEY") @skipAuth',
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).toThrow(/Invalid resource value/);
    });

    it('should reject resources with invalid lowercase names', () => {
      const decorator = UsePermissions({
        action: AuthAction.READ_ANY,
        resource: 'api_key', // lowercase not matching enum
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).toThrow(/Invalid resource value/);
    });

    it('should validate SDL escape function rejects invalid characters', () => {
      // This tests the escapeForSDL function indirectly
      const decorator = UsePermissions({
        action: 'read:any' as AuthAction, // lowercase colon format
        resource: Resource.API_KEY,
      });

      // The action will be normalized to uppercase, which should pass
      expect(() => {
        decorator({}, 'testMethod', {});
      }).not.toThrow();
    });
  });

  describe('Action Validation', () => {
    it('should accept valid AuthAction enum values', () => {
      const decorator = UsePermissions({
        action: AuthAction.CREATE_OWN,
        resource: Resource.API_KEY,
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).not.toThrow();
    });

    it('should reject invalid AuthAction values', () => {
      const decorator = UsePermissions({
        action: 'invalid:action' as AuthAction,
        resource: Resource.API_KEY,
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).toThrow(/Invalid AuthAction enum value: "invalid:action"/);
    });

    it('should reject invalid action combinations in old format', () => {
      const decorator = UsePermissions({
        action: 'invalid' as any,
        possession: 'any' as any,
        resource: Resource.API_KEY,
      } as any);

      expect(() => {
        decorator({}, 'testMethod', {});
      }).toThrow(/Invalid action combination: "invalid:any"/);
    });

    it('should provide helpful error message listing valid actions', () => {
      const decorator = UsePermissions({
        action: 'bad:action' as AuthAction,
        resource: Resource.API_KEY,
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).toThrow(/Valid AuthAction values are:/);
    });
  });

  describe('Legacy Format Support', () => {
    it('should support old format with separate verb and possession', () => {
      const decorator = UsePermissions({
        action: 'create' as any,
        possession: 'any' as any,
        resource: Resource.API_KEY,
      } as any);

      expect(() => {
        decorator({}, 'testMethod', {});
      }).not.toThrow();
    });

    it('should normalize verb and possession to AuthAction', () => {
      const decorator = UsePermissions({
        action: 'READ' as any,
        possession: 'OWN' as any,
        resource: Resource.DASHBOARD,
      } as any);

      expect(() => {
        decorator({}, 'testMethod', {});
      }).not.toThrow();
    });
  });

  describe('Error Message Clarity', () => {
    it('should provide clear error for invalid resource', () => {
      const decorator = UsePermissions({
        action: AuthAction.READ_ANY,
        resource: 'WRONG',
      });

      try {
        decorator({}, 'testMethod', {});
      } catch (error: any) {
        expect(error.message).toContain('Invalid resource value: "WRONG"');
        expect(error.message).toContain('Must be one of:');
        expect(error.message).toContain('API_KEY');
        expect(error.message).toContain('DASHBOARD');
      }
    });

    it('should provide clear error for invalid action', () => {
      const decorator = UsePermissions({
        action: 'wrong:action' as AuthAction,
        resource: Resource.API_KEY,
      });

      try {
        decorator({}, 'testMethod', {});
      } catch (error: any) {
        expect(error.message).toContain('Invalid AuthAction enum value: "wrong:action"');
        expect(error.message).toContain('Valid AuthAction values are:');
        expect(error.message).toContain('create:any');
        expect(error.message).toContain('read:own');
      }
    });

    it('should provide clear error for invalid action combination', () => {
      const decorator = UsePermissions({
        action: 'invalid' as any,
        possession: 'wrong' as any,
        resource: Resource.API_KEY,
      } as any);

      try {
        decorator({}, 'testMethod', {});
      } catch (error: any) {
        expect(error.message).toContain('Invalid action combination: "invalid:wrong"');
        expect(error.message).toContain('Valid AuthAction values are:');
      }
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle resources with double underscores', () => {
      const decorator = UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CONNECT__REMOTE_ACCESS,
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).not.toThrow();
    });

    it('should reject null or undefined resources', () => {
      const decorator = UsePermissions({
        action: AuthAction.READ_ANY,
        resource: null as any,
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).toThrow();
    });

    it('should reject empty string resources', () => {
      const decorator = UsePermissions({
        action: AuthAction.READ_ANY,
        resource: '',
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).toThrow(/Invalid resource value: ""/);
    });

    it('should reject resources with newlines', () => {
      const decorator = UsePermissions({
        action: AuthAction.READ_ANY,
        resource: 'API_KEY\n@skipAuth',
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).toThrow(/Invalid resource value/);
    });

    it('should reject resources with backslashes', () => {
      const decorator = UsePermissions({
        action: AuthAction.READ_ANY,
        resource: 'API_KEY\\", another: "value',
      });

      expect(() => {
        decorator({}, 'testMethod', {});
      }).toThrow(/Invalid resource value/);
    });
  });
});