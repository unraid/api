import { describe, it, expect } from 'vitest';
import { encodePermissionsToScopes, decodeScopesToPermissions } from '../utils/authorizationScopes';
import { AuthAction, Resource } from '../composables/gql/graphql';

describe('authorizationScopes', () => {
  describe('encodePermissionsToScopes', () => {
    describe('duplicate handling', () => {
      it('should deduplicate action verbs when multiple permissions have duplicate actions', () => {
        const permissions = [
          {
            resource: Resource.DOCKER,
            actions: [AuthAction.READ_ANY, AuthAction.READ_OWN, AuthAction.UPDATE_ANY]
          }
        ];
        
        const scopes = encodePermissionsToScopes([], permissions);
        
        // Should produce "docker:read_any+read_own+update_any" with distinct actions preserved
        expect(scopes).toHaveLength(1);
        expect(scopes[0]).toBe('docker:read_any+read_own+update_any');
      });

      it('should deduplicate resource names when grouped', () => {
        const permissions = [
          {
            resource: Resource.DOCKER,
            actions: [AuthAction.READ_ANY]
          },
          {
            resource: Resource.DOCKER,
            actions: [AuthAction.READ_OWN]
          }
        ];
        
        const scopes = encodePermissionsToScopes([], permissions);
        
        // Should produce "docker:read_any+read_own" merging both permissions
        expect(scopes).toHaveLength(1);
        expect(scopes[0]).toBe('docker:read_any+read_own');
      });

      it('should handle multiple duplicate resources and actions correctly', () => {
        const permissions = [
          {
            resource: Resource.DOCKER,
            actions: [AuthAction.READ_ANY, AuthAction.READ_OWN, AuthAction.UPDATE_ANY]
          },
          {
            resource: Resource.VMS,
            actions: [AuthAction.READ_ANY, AuthAction.UPDATE_OWN, AuthAction.UPDATE_ANY]
          },
          {
            resource: Resource.DOCKER,
            actions: [AuthAction.READ_OWN, AuthAction.UPDATE_OWN]
          }
        ];
        
        const scopes = encodePermissionsToScopes([], permissions);
        
        // Docker: READ_ANY, READ_OWN, UPDATE_ANY, UPDATE_OWN (merged from both)
        // VMS: READ_ANY, UPDATE_OWN, UPDATE_ANY
        // Different action sets, so separate scopes
        expect(scopes).toHaveLength(2);
        const scopeStrings = scopes.sort();
        expect(scopeStrings).toContain('docker:read_any+read_own+update_any+update_own');
        expect(scopeStrings).toContain('vms:read_any+update_any+update_own');
      });

      it('should maintain consistent sorting for actions and resources', () => {
        const permissions = [
          {
            resource: Resource.VMS,
            actions: [AuthAction.UPDATE_ANY, AuthAction.READ_ANY]
          },
          {
            resource: Resource.DOCKER,
            actions: [AuthAction.UPDATE_ANY, AuthAction.READ_ANY]
          }
        ];
        
        const scopes = encodePermissionsToScopes([], permissions);
        
        // Should sort resources (docker before vms) and actions alphabetically
        expect(scopes).toHaveLength(1);
        expect(scopes[0]).toBe('docker+vms:read_any+update_any');
      });

      it('should handle all CRUD actions without creating wildcard', () => {
        const permissions = [
          {
            resource: Resource.DOCKER,
            actions: [
              AuthAction.CREATE_ANY, AuthAction.CREATE_OWN,
              AuthAction.READ_ANY, AuthAction.READ_OWN,
              AuthAction.UPDATE_ANY, AuthAction.UPDATE_OWN,
              AuthAction.DELETE_ANY, AuthAction.DELETE_OWN
            ]
          }
        ];
        
        const scopes = encodePermissionsToScopes([], permissions);
        
        // Should just list all actions, no wildcard conversion
        expect(scopes).toHaveLength(1);
        expect(scopes[0]).toBe('docker:create_any+create_own+delete_any+delete_own+read_any+read_own+update_any+update_own');
      });

      it('should handle edge case with empty actions after deduplication', () => {
        const permissions = [
          {
            resource: Resource.DOCKER,
            actions: []
          }
        ];
        
        const scopes = encodePermissionsToScopes([], permissions);
        
        // Should not produce any scope for empty actions
        expect(scopes).toHaveLength(0);
      });

      it('should deduplicate resources across multiple permissions with same action set', () => {
        const permissions = [
          {
            resource: Resource.DOCKER,
            actions: [AuthAction.READ_ANY]
          },
          {
            resource: Resource.VMS,
            actions: [AuthAction.READ_OWN]
          },
          {
            resource: Resource.DOCKER,
            actions: [AuthAction.READ_OWN]
          },
          {
            resource: Resource.VMS,
            actions: [AuthAction.READ_ANY]
          }
        ];
        
        const scopes = encodePermissionsToScopes([], permissions);
        
        // Both DOCKER and VMS have READ_ANY and READ_OWN, should group without duplicates
        expect(scopes).toHaveLength(1);
        expect(scopes[0]).toBe('docker+vms:read_any+read_own');
      });

      it('should produce deterministic output for same input regardless of order', () => {
        const permissions1 = [
          { resource: Resource.VMS, actions: [AuthAction.UPDATE_ANY, AuthAction.READ_ANY] },
          { resource: Resource.DOCKER, actions: [AuthAction.READ_ANY, AuthAction.UPDATE_ANY] }
        ];
        
        const permissions2 = [
          { resource: Resource.DOCKER, actions: [AuthAction.UPDATE_ANY, AuthAction.READ_ANY] },
          { resource: Resource.VMS, actions: [AuthAction.READ_ANY, AuthAction.UPDATE_ANY] }
        ];
        
        const scopes1 = encodePermissionsToScopes([], permissions1);
        const scopes2 = encodePermissionsToScopes([], permissions2);
        
        expect(scopes1).toEqual(scopes2);
        expect(scopes1[0]).toBe('docker+vms:read_any+update_any');
      });
    });

    describe('roundtrip encoding/decoding', () => {
      it('should maintain permissions through encode/decode cycle with duplicates', () => {
        const originalPermissions = [
          {
            resource: Resource.DOCKER,
            actions: [AuthAction.READ_ANY, AuthAction.READ_OWN, AuthAction.UPDATE_ANY]
          },
          {
            resource: Resource.VMS,
            actions: [AuthAction.READ_OWN, AuthAction.UPDATE_OWN, AuthAction.UPDATE_ANY]
          }
        ];
        
        const scopes = encodePermissionsToScopes([], originalPermissions);
        const { permissions: decoded } = decodeScopesToPermissions(scopes);
        
        // Now possession is preserved in the encoding
        expect(decoded).toHaveLength(2);
        
        const dockerPerm = decoded.find(p => p.resource === Resource.DOCKER);
        const vmsPerm = decoded.find(p => p.resource === Resource.VMS);
        
        // Docker should have its specific actions preserved
        expect(dockerPerm?.actions).toContain(AuthAction.READ_ANY);
        expect(dockerPerm?.actions).toContain(AuthAction.READ_OWN);
        expect(dockerPerm?.actions).toContain(AuthAction.UPDATE_ANY);
        
        // VMS should have its specific actions preserved
        expect(vmsPerm?.actions).toContain(AuthAction.READ_OWN);
        expect(vmsPerm?.actions).toContain(AuthAction.UPDATE_OWN);
        expect(vmsPerm?.actions).toContain(AuthAction.UPDATE_ANY);
        
        // The scopes should be separate since they have different action sets
        expect(scopes).toHaveLength(2);
      });
    });
  });
});
