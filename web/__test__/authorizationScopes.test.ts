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
        
        // Should produce "docker:read+update" not "docker:read+read+update"
        expect(scopes).toHaveLength(1);
        expect(scopes[0]).toBe('docker:read+update');
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
        
        // Should produce "docker:read" not "docker+docker:read"
        expect(scopes).toHaveLength(1);
        expect(scopes[0]).toBe('docker:read');
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
        
        // Docker has: READ_ANY, READ_OWN, UPDATE_ANY, UPDATE_OWN -> read+update
        // VMS has: READ_ANY, UPDATE_ANY, UPDATE_OWN -> read+update
        // Both have same action set, should group: "docker+vms:read+update"
        expect(scopes).toHaveLength(1);
        expect(scopes[0]).toBe('docker+vms:read+update');
      });

      it('should maintain consistent sorting for actions and resources', () => {
        const permissions = [
          {
            resource: Resource.VMS,
            actions: [AuthAction.UPDATE_ANY, AuthAction.READ_ANY]
          },
          {
            resource: Resource.DOCKER,
            actions: [AuthAction.UPDATE_OWN, AuthAction.READ_OWN]
          }
        ];
        
        const scopes = encodePermissionsToScopes([], permissions);
        
        // Should sort resources (docker before vms) and actions (read before update)
        expect(scopes).toHaveLength(1);
        expect(scopes[0]).toBe('docker+vms:read+update');
      });

      it('should not duplicate wildcard when all CRUD actions are present multiple times', () => {
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
        
        // Should recognize as wildcard despite duplicates
        expect(scopes).toHaveLength(1);
        expect(scopes[0]).toBe('docker:*');
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
        expect(scopes[0]).toBe('docker+vms:read');
      });

      it('should produce deterministic output for same input regardless of order', () => {
        const permissions1 = [
          { resource: Resource.VMS, actions: [AuthAction.UPDATE_ANY, AuthAction.READ_ANY] },
          { resource: Resource.DOCKER, actions: [AuthAction.READ_OWN, AuthAction.UPDATE_OWN] }
        ];
        
        const permissions2 = [
          { resource: Resource.DOCKER, actions: [AuthAction.UPDATE_OWN, AuthAction.READ_OWN] },
          { resource: Resource.VMS, actions: [AuthAction.READ_ANY, AuthAction.UPDATE_ANY] }
        ];
        
        const scopes1 = encodePermissionsToScopes([], permissions1);
        const scopes2 = encodePermissionsToScopes([], permissions2);
        
        expect(scopes1).toEqual(scopes2);
        expect(scopes1[0]).toBe('docker+vms:read+update');
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
        
        // The encoding deduplicates by action verb (read, update) not by possession
        // So READ_ANY and READ_OWN both become just "read" in the scope
        // When decoded back, they default to _ANY possession
        expect(decoded).toHaveLength(2);
        
        const dockerPerm = decoded.find(p => p.resource === Resource.DOCKER);
        const vmsPerm = decoded.find(p => p.resource === Resource.VMS);
        
        // Both resources should have read and update actions (defaulting to _ANY)
        expect(dockerPerm?.actions).toContain(AuthAction.READ_ANY);
        expect(dockerPerm?.actions).toContain(AuthAction.UPDATE_ANY);
        
        expect(vmsPerm?.actions).toContain(AuthAction.READ_ANY);
        expect(vmsPerm?.actions).toContain(AuthAction.UPDATE_ANY);
        
        // The scope should be efficiently grouped since both have same verbs
        expect(scopes).toHaveLength(1);
        expect(scopes[0]).toBe('docker+vms:read+update');
      });
    });
  });
});
