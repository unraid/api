import { Resource } from '@unraid/shared/graphql.model.js';
import { AuthAction } from 'nest-authz';
import { describe, expect, it } from 'vitest';

import {
    convertPermissionSetsToArrays,
    expandWildcardAction,
    mergePermissionsIntoMap,
    reconcileWildcardPermissions,
} from '@app/unraid-api/graph/resolvers/api-key/permissions.utils.js';

describe('permissions.utils', () => {
    describe('mergePermissionsIntoMap', () => {
        it('should merge permissions from source map into empty target map', () => {
            const target = new Map<Resource, Set<string>>();
            const source = new Map<Resource, string[]>([
                [Resource.DOCKER, ['READ_ANY', 'UPDATE_ANY']],
                [Resource.VMS, ['CREATE_ANY']],
            ]);

            mergePermissionsIntoMap(target, source);

            expect(target.size).toBe(2);
            expect(Array.from(target.get(Resource.DOCKER)!)).toEqual(['READ_ANY', 'UPDATE_ANY']);
            expect(Array.from(target.get(Resource.VMS)!)).toEqual(['CREATE_ANY']);
        });

        it('should merge permissions into existing target map without duplicates', () => {
            const target = new Map<Resource, Set<string>>([[Resource.DOCKER, new Set(['READ_ANY'])]]);
            const source = new Map<Resource, string[]>([
                [Resource.DOCKER, ['READ_ANY', 'UPDATE_ANY']], // READ_ANY is duplicate
                [Resource.VMS, ['CREATE_ANY']],
            ]);

            mergePermissionsIntoMap(target, source);

            expect(target.size).toBe(2);
            expect(Array.from(target.get(Resource.DOCKER)!).sort()).toEqual(['READ_ANY', 'UPDATE_ANY']);
            expect(Array.from(target.get(Resource.VMS)!)).toEqual(['CREATE_ANY']);
        });

        it('should handle empty source map', () => {
            const target = new Map<Resource, Set<string>>([[Resource.DOCKER, new Set(['READ_ANY'])]]);
            const source = new Map<Resource, string[]>();

            mergePermissionsIntoMap(target, source);

            expect(target.size).toBe(1);
            expect(Array.from(target.get(Resource.DOCKER)!)).toEqual(['READ_ANY']);
        });

        it('should handle source with empty action arrays', () => {
            const target = new Map<Resource, Set<string>>();
            const source = new Map<Resource, string[]>([[Resource.DOCKER, []]]);

            mergePermissionsIntoMap(target, source);

            expect(target.size).toBe(1);
            expect(Array.from(target.get(Resource.DOCKER)!)).toEqual([]);
        });
    });

    describe('expandWildcardAction', () => {
        it('should return all CRUD operations with _ANY suffix', () => {
            const actions = expandWildcardAction();

            expect(actions).toHaveLength(4);
            expect(actions).toContain(AuthAction.CREATE_ANY);
            expect(actions).toContain(AuthAction.READ_ANY);
            expect(actions).toContain(AuthAction.UPDATE_ANY);
            expect(actions).toContain(AuthAction.DELETE_ANY);
        });

        it('should always return the same set of actions', () => {
            const actions1 = expandWildcardAction();
            const actions2 = expandWildcardAction();

            expect(actions1).toEqual(actions2);
        });
    });

    describe('reconcileWildcardPermissions', () => {
        it('should apply wildcard permissions to all resources', () => {
            const permissions = new Map<Resource | '*', Set<string>>([
                ['*', new Set(['READ_ANY', 'UPDATE_ANY'])],
                [Resource.DOCKER, new Set(['DELETE_ANY'])],
            ]);

            reconcileWildcardPermissions(permissions);

            // Wildcard key should be removed
            expect(permissions.has('*')).toBe(false);

            // Docker should have both its original and wildcard permissions
            const dockerActions = Array.from(permissions.get(Resource.DOCKER)!).sort();
            expect(dockerActions).toEqual(['DELETE_ANY', 'READ_ANY', 'UPDATE_ANY']);

            // All other resources should have wildcard permissions
            // Check a sample of resources
            const vmActions = permissions.get(Resource.VMS); // Correct enum value is VMS not VM
            expect(vmActions).toBeDefined();
            expect(Array.from(vmActions!).sort()).toEqual(['READ_ANY', 'UPDATE_ANY']);

            const arrayActions = permissions.get(Resource.ARRAY);
            expect(arrayActions).toBeDefined();
            expect(Array.from(arrayActions!).sort()).toEqual(['READ_ANY', 'UPDATE_ANY']);
        });

        it('should handle no wildcard permissions', () => {
            const permissions = new Map<Resource | '*', Set<string>>([
                [Resource.DOCKER, new Set(['READ_ANY'])],
                [Resource.VMS, new Set(['CREATE_ANY'])],
            ]);

            const originalSize = permissions.size;
            reconcileWildcardPermissions(permissions);

            // Should not change anything
            expect(permissions.size).toBe(originalSize);
            expect(Array.from(permissions.get(Resource.DOCKER)!)).toEqual(['READ_ANY']);
            expect(Array.from(permissions.get(Resource.VMS)!)).toEqual(['CREATE_ANY']);
        });

        it('should handle wildcard-only permissions', () => {
            const permissions = new Map<Resource | '*', Set<string>>([['*', new Set(['READ_ANY'])]]);

            reconcileWildcardPermissions(permissions);

            // Should have permissions for all resources
            expect(permissions.has('*')).toBe(false);

            // Check that multiple resources got the wildcard permissions
            const resourcesWithPermissions = Array.from(permissions.keys());
            expect(resourcesWithPermissions.length).toBeGreaterThan(10); // There are many resources

            // All should have READ_ANY
            for (const [_, actions] of permissions) {
                expect(Array.from(actions)).toEqual(['READ_ANY']);
            }
        });

        it('should handle empty wildcard permissions', () => {
            const permissions = new Map<Resource | '*', Set<string>>([
                ['*', new Set()],
                [Resource.DOCKER, new Set(['READ_ANY'])],
            ]);

            reconcileWildcardPermissions(permissions);

            // Wildcard should be removed
            expect(permissions.has('*')).toBe(false);

            // Docker should keep its permissions
            expect(Array.from(permissions.get(Resource.DOCKER)!)).toEqual(['READ_ANY']);

            // Other resources should exist but with empty permissions
            const vmActions = permissions.get(Resource.VMS); // Correct enum value is VMS not VM
            expect(vmActions).toBeDefined();
            expect(Array.from(vmActions!)).toEqual([]);
        });
    });

    describe('convertPermissionSetsToArrays', () => {
        it('should convert Sets to arrays', () => {
            const input = new Map<Resource | '*', Set<string>>([
                [Resource.DOCKER, new Set(['READ_ANY', 'UPDATE_ANY'])],
                [Resource.VMS, new Set(['CREATE_ANY'])],
            ]);

            const result = convertPermissionSetsToArrays(input);

            expect(result.size).toBe(2);
            expect(result.get(Resource.DOCKER)).toEqual(['READ_ANY', 'UPDATE_ANY']);
            expect(result.get(Resource.VMS)).toEqual(['CREATE_ANY']);
        });

        it('should skip wildcard key if present', () => {
            const input = new Map<Resource | '*', Set<string>>([
                ['*', new Set(['READ_ANY'])],
                [Resource.DOCKER, new Set(['UPDATE_ANY'])],
            ]);

            const result = convertPermissionSetsToArrays(input);

            expect(result.size).toBe(1);
            expect(result.has('*' as Resource)).toBe(false);
            expect(result.get(Resource.DOCKER)).toEqual(['UPDATE_ANY']);
        });

        it('should handle empty input map', () => {
            const input = new Map<Resource | '*', Set<string>>();
            const result = convertPermissionSetsToArrays(input);

            expect(result.size).toBe(0);
        });

        it('should preserve empty Sets as empty arrays', () => {
            const input = new Map<Resource | '*', Set<string>>([[Resource.DOCKER, new Set()]]);

            const result = convertPermissionSetsToArrays(input);

            expect(result.size).toBe(1);
            expect(result.get(Resource.DOCKER)).toEqual([]);
        });

        it('should maintain order of actions in the array', () => {
            const input = new Map<Resource | '*', Set<string>>([
                [Resource.DOCKER, new Set(['DELETE_ANY', 'CREATE_ANY', 'UPDATE_ANY', 'READ_ANY'])],
            ]);

            const result = convertPermissionSetsToArrays(input);
            const actions = result.get(Resource.DOCKER)!;

            // Sets maintain insertion order in JavaScript
            expect(actions).toEqual(['DELETE_ANY', 'CREATE_ANY', 'UPDATE_ANY', 'READ_ANY']);
        });
    });

    describe('integration tests', () => {
        it('should handle a complete workflow with wildcards', () => {
            // Start with a permissions map that includes wildcards
            const permissions = new Map<Resource | '*', Set<string>>([
                ['*', new Set(['READ_ANY'])],
                [Resource.DOCKER, new Set(['DELETE_ANY'])],
            ]);

            // Reconcile wildcards
            reconcileWildcardPermissions(permissions);

            // Convert to arrays
            const result = convertPermissionSetsToArrays(permissions);

            // Docker should have both its specific and wildcard permissions
            expect(result.get(Resource.DOCKER)!.sort()).toEqual(['DELETE_ANY', 'READ_ANY']);

            // Other resources should have wildcard permissions
            expect(result.get(Resource.VMS)).toEqual(['READ_ANY']); // Correct enum value is VMS not VM
            expect(result.get(Resource.ARRAY)).toEqual(['READ_ANY']);
        });

        it('should handle merging multiple permission sources', () => {
            // Simulate merging permissions from multiple roles
            const target = new Map<Resource, Set<string>>();

            const role1Permissions = new Map<Resource, string[]>([
                [Resource.DOCKER, ['READ_ANY']],
                [Resource.VMS, ['READ_ANY']],
            ]);

            const role2Permissions = new Map<Resource, string[]>([
                [Resource.DOCKER, ['UPDATE_ANY', 'DELETE_ANY']],
                [Resource.FLASH, ['CREATE_ANY']],
            ]);

            mergePermissionsIntoMap(target, role1Permissions);
            mergePermissionsIntoMap(target, role2Permissions);

            // Docker should have all three permissions
            expect(Array.from(target.get(Resource.DOCKER)!).sort()).toEqual([
                'DELETE_ANY',
                'READ_ANY',
                'UPDATE_ANY',
            ]);

            // VMS should have only READ_ANY
            expect(Array.from(target.get(Resource.VMS)!)).toEqual(['READ_ANY']);

            // FLASH should have CREATE_ANY
            expect(Array.from(target.get(Resource.FLASH)!)).toEqual(['CREATE_ANY']);
        });
    });
});
