import { describe, expect, it } from 'vitest';
import { AuthAction } from '../graphql-enums.js';
import { normalizeLegacyAction, normalizeLegacyActions, parseActionToAuthAction } from './permissions.js';

describe('normalizeLegacyAction', () => {
  describe('simple verb format (legacy)', () => {
    it('should convert simple verbs to AuthAction enum values', () => {
      expect(normalizeLegacyAction('create')).toBe(AuthAction.CREATE_ANY);
      expect(normalizeLegacyAction('read')).toBe(AuthAction.READ_ANY);
      expect(normalizeLegacyAction('update')).toBe(AuthAction.UPDATE_ANY);
      expect(normalizeLegacyAction('delete')).toBe(AuthAction.DELETE_ANY);
    });

    it('should handle uppercase simple verbs', () => {
      expect(normalizeLegacyAction('CREATE')).toBe(AuthAction.CREATE_ANY);
      expect(normalizeLegacyAction('READ')).toBe(AuthAction.READ_ANY);
      expect(normalizeLegacyAction('UPDATE')).toBe(AuthAction.UPDATE_ANY);
      expect(normalizeLegacyAction('DELETE')).toBe(AuthAction.DELETE_ANY);
    });

    it('should handle mixed case simple verbs', () => {
      expect(normalizeLegacyAction('Create')).toBe(AuthAction.CREATE_ANY);
      expect(normalizeLegacyAction('Read')).toBe(AuthAction.READ_ANY);
      expect(normalizeLegacyAction('Update')).toBe(AuthAction.UPDATE_ANY);
      expect(normalizeLegacyAction('Delete')).toBe(AuthAction.DELETE_ANY);
    });
  });

  describe('uppercase underscore format (GraphQL enum style)', () => {
    it('should convert CREATE_ANY format to AuthAction enums', () => {
      expect(normalizeLegacyAction('CREATE_ANY')).toBe(AuthAction.CREATE_ANY);
      expect(normalizeLegacyAction('READ_ANY')).toBe(AuthAction.READ_ANY);
      expect(normalizeLegacyAction('UPDATE_ANY')).toBe(AuthAction.UPDATE_ANY);
      expect(normalizeLegacyAction('DELETE_ANY')).toBe(AuthAction.DELETE_ANY);
    });

    it('should convert CREATE_OWN format to AuthAction enums', () => {
      expect(normalizeLegacyAction('CREATE_OWN')).toBe(AuthAction.CREATE_OWN);
      expect(normalizeLegacyAction('READ_OWN')).toBe(AuthAction.READ_OWN);
      expect(normalizeLegacyAction('UPDATE_OWN')).toBe(AuthAction.UPDATE_OWN);
      expect(normalizeLegacyAction('DELETE_OWN')).toBe(AuthAction.DELETE_OWN);
    });

    it('should handle mixed case underscore format', () => {
      expect(normalizeLegacyAction('Create_Any')).toBe(AuthAction.CREATE_ANY);
      expect(normalizeLegacyAction('Read_Own')).toBe(AuthAction.READ_OWN);
    });
  });

  describe('already correct format (Casbin style)', () => {
    it('should convert lowercase:colon format to enums', () => {
      expect(normalizeLegacyAction('create:any')).toBe(AuthAction.CREATE_ANY);
      expect(normalizeLegacyAction('read:any')).toBe(AuthAction.READ_ANY);
      expect(normalizeLegacyAction('update:any')).toBe(AuthAction.UPDATE_ANY);
      expect(normalizeLegacyAction('delete:any')).toBe(AuthAction.DELETE_ANY);
    });

    it('should normalize uppercase:colon to enums', () => {
      expect(normalizeLegacyAction('CREATE:ANY')).toBe(AuthAction.CREATE_ANY);
      expect(normalizeLegacyAction('READ:OWN')).toBe(AuthAction.READ_OWN);
    });

    it('should handle :own possession correctly', () => {
      expect(normalizeLegacyAction('create:own')).toBe(AuthAction.CREATE_OWN);
      expect(normalizeLegacyAction('read:own')).toBe(AuthAction.READ_OWN);
      expect(normalizeLegacyAction('update:own')).toBe(AuthAction.UPDATE_OWN);
      expect(normalizeLegacyAction('delete:own')).toBe(AuthAction.DELETE_OWN);
    });
  });

  describe('edge cases', () => {
    it('should return null for unknown actions', () => {
      expect(normalizeLegacyAction('unknown')).toBeNull();
      expect(normalizeLegacyAction('UNKNOWN')).toBeNull();
      expect(normalizeLegacyAction('some_other_action')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(normalizeLegacyAction('')).toBeNull();
    });

    it('should return null for wildcards (not a valid AuthAction)', () => {
      expect(normalizeLegacyAction('*')).toBeNull();
    });
  });
});

describe('integration with parseActionToAuthAction', () => {
  it('should produce valid AuthAction enum values after normalization', () => {
    // Test that normalized actions can be parsed to valid enum values
    const testCases = [
      { input: 'create', normalized: AuthAction.CREATE_ANY, expected: AuthAction.CREATE_ANY },
      { input: 'CREATE_ANY', normalized: AuthAction.CREATE_ANY, expected: AuthAction.CREATE_ANY },
      { input: 'read:own', normalized: AuthAction.READ_OWN, expected: AuthAction.READ_OWN },
      { input: 'UPDATE_OWN', normalized: AuthAction.UPDATE_OWN, expected: AuthAction.UPDATE_OWN },
    ];

    for (const testCase of testCases) {
      const normalized = normalizeLegacyAction(testCase.input);
      expect(normalized).not.toBeNull();
      expect(normalized).toBe(testCase.normalized);
      
      // Since we've asserted normalized is not null, we can safely use it
      if (normalized !== null) {
        const parsed = parseActionToAuthAction(normalized);
        expect(parsed).toBe(testCase.expected);
      }
    }
  });

  it('should handle all AuthAction enum values', () => {
    // Ensure all enum values can round-trip through normalization
    const allActions = Object.values(AuthAction);
    
    for (const action of allActions) {
      // The enum value itself should normalize correctly
      const normalized = normalizeLegacyAction(action);
      expect(normalized).not.toBeNull();
      
      if (normalized !== null) {
        const parsed = parseActionToAuthAction(normalized);
        expect(parsed).toBe(action);
      }
    }
  });
});

describe('normalizeLegacyActions (array helper)', () => {
  it('should normalize an array of mixed format actions', () => {
    const mixedActions = [
      'create',           // Simple verb
      'READ_ANY',         // Uppercase underscore
      'update:own',       // Already correct
      'DELETE',           // Uppercase simple verb
      'invalid_action',   // Invalid action
      '',                 // Empty string
    ];
    
    const normalized = normalizeLegacyActions(mixedActions);
    
    expect(normalized).toEqual([
      AuthAction.CREATE_ANY,
      AuthAction.READ_ANY,
      AuthAction.UPDATE_OWN,
      AuthAction.DELETE_ANY,
      // invalid_action and empty string are filtered out
    ]);
  });

  it('should handle empty array', () => {
    expect(normalizeLegacyActions([])).toEqual([]);
  });

  it('should filter out all invalid actions', () => {
    const invalidActions = ['invalid', 'unknown', 'some_other'];
    expect(normalizeLegacyActions(invalidActions)).toEqual([]);
  });

  it('should preserve all valid actions', () => {
    const validActions = [
      'create:any',
      'read:any',
      'update:any',
      'delete:any',
      'create:own',
      'read:own',
      'update:own',
      'delete:own',
    ];
    
    const normalized = normalizeLegacyActions(validActions);
    
    expect(normalized).toEqual([
      AuthAction.CREATE_ANY,
      AuthAction.READ_ANY,
      AuthAction.UPDATE_ANY,
      AuthAction.DELETE_ANY,
      AuthAction.CREATE_OWN,
      AuthAction.READ_OWN,
      AuthAction.UPDATE_OWN,
      AuthAction.DELETE_OWN,
    ]);
  });
});

describe('API key loading scenarios', () => {
  it('should handle legacy simple verb format from old API keys', () => {
    const legacyActions = ['create', 'read', 'update', 'delete'];
    const normalized = normalizeLegacyActions(legacyActions);
    
    expect(normalized).toEqual([
      AuthAction.CREATE_ANY,
      AuthAction.READ_ANY,
      AuthAction.UPDATE_ANY,
      AuthAction.DELETE_ANY,
    ]);
  });

  it('should handle mixed format from partially migrated API keys', () => {
    const mixedActions = [
      'CREATE_ANY',
      'read:any',
      'update',
      'DELETE_OWN'
    ];
    
    const normalized = normalizeLegacyActions(mixedActions);
    
    expect(normalized).toEqual([
      AuthAction.CREATE_ANY,
      AuthAction.READ_ANY,
      AuthAction.UPDATE_ANY,
      AuthAction.DELETE_OWN,
    ]);
  });

  it('should handle current Casbin format', () => {
    const currentActions = [
      'create:any',
      'read:any',
      'update:any',
      'delete:any'
    ];
    
    const normalized = normalizeLegacyActions(currentActions);
    
    expect(normalized).toEqual([
      AuthAction.CREATE_ANY,
      AuthAction.READ_ANY,
      AuthAction.UPDATE_ANY,
      AuthAction.DELETE_ANY,
    ]);
  });
});