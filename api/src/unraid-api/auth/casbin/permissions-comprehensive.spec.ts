import { Resource, Role } from '@unraid/shared/graphql.model.js';
import { Model as CasbinModel, newEnforcer, StringAdapter } from 'casbin';
import { AuthAction } from 'nest-authz';
import { beforeEach, describe, expect, it } from 'vitest';

import { CASBIN_MODEL } from '@app/unraid-api/auth/casbin/model.js';
import { BASE_POLICY } from '@app/unraid-api/auth/casbin/policy.js';

describe('Comprehensive Casbin Permissions Tests', () => {
    describe('All UsePermissions decorator combinations', () => {
        // Test all resource/action combinations used in the codebase
        const testCases = [
            // API_KEY permissions
            {
                resource: Resource.API_KEY,
                action: 'read:any',
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST],
            },
            {
                resource: Resource.API_KEY,
                action: 'create:any',
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST, Role.CONNECT],
            },
            {
                resource: Resource.API_KEY,
                action: 'update:any',
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST, Role.CONNECT],
            },
            {
                resource: Resource.API_KEY,
                action: 'delete:any',
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST, Role.CONNECT],
            },

            // PERMISSION resource (for listing possible permissions)
            {
                resource: Resource.PERMISSION,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },

            // ARRAY permissions
            {
                resource: Resource.ARRAY,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.ARRAY,
                action: 'update:any',
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST],
            },

            // CONFIG permissions
            {
                resource: Resource.CONFIG,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.CONFIG,
                action: 'update:any',
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST, Role.CONNECT],
            },

            // DOCKER permissions
            {
                resource: Resource.DOCKER,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.DOCKER,
                action: 'update:any',
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST],
            },

            // VMS permissions
            {
                resource: Resource.VMS,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.VMS,
                action: 'update:any',
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST],
            },

            // FLASH permissions (includes rclone operations)
            {
                resource: Resource.FLASH,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.FLASH,
                action: 'create:any',
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST, Role.CONNECT],
            },
            {
                resource: Resource.FLASH,
                action: 'delete:any',
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST, Role.CONNECT],
            },

            // INFO permissions (system information)
            {
                resource: Resource.INFO,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },

            // LOGS permissions
            {
                resource: Resource.LOGS,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },

            // ME permissions (current user info)
            {
                resource: Resource.ME,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT, Role.GUEST],
                deniedRoles: [],
            },

            // NOTIFICATIONS permissions
            {
                resource: Resource.NOTIFICATIONS,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },

            // Other read-only resources for VIEWER
            {
                resource: Resource.DISK,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.DISPLAY,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.ONLINE,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.OWNER,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.REGISTRATION,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.SERVERS,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.SERVICES,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.SHARE,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.VARS,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.CUSTOMIZATIONS,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.ACTIVATION_CODE,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },

            // CONNECT special permission for remote access
            {
                resource: Resource.CONNECT__REMOTE_ACCESS,
                action: 'read:any',
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.CONNECT__REMOTE_ACCESS,
                action: 'update:any',
                allowedRoles: [Role.ADMIN, Role.CONNECT],
                deniedRoles: [Role.VIEWER, Role.GUEST],
            },
        ];

        testCases.forEach(({ resource, action, allowedRoles, deniedRoles }) => {
            describe(`${resource} - ${action}`, () => {
                let enforcer: any;

                beforeEach(async () => {
                    const model = new CasbinModel();
                    model.loadModelFromText(CASBIN_MODEL);
                    const adapter = new StringAdapter(BASE_POLICY);
                    enforcer = await newEnforcer(model, adapter);
                });

                allowedRoles.forEach((role) => {
                    it(`should allow ${role} to ${action} ${resource}`, async () => {
                        const result = await enforcer.enforce(role, resource, action);
                        expect(result).toBe(true);
                    });
                });

                deniedRoles.forEach((role) => {
                    it(`should deny ${role} to ${action} ${resource}`, async () => {
                        const result = await enforcer.enforce(role, resource, action);
                        expect(result).toBe(false);
                    });
                });
            });
        });
    });

    describe('Action matching and normalization', () => {
        let enforcer: any;

        beforeEach(async () => {
            const model = new CasbinModel();
            model.loadModelFromText(CASBIN_MODEL);
            const adapter = new StringAdapter(BASE_POLICY);
            enforcer = await newEnforcer(model, adapter);
        });

        it('should match actions exactly as stored (lowercase)', async () => {
            // Our policies store actions as lowercase (e.g., 'read:any')
            // The matcher now requires exact matching for security

            // Lowercase actions should work
            const adminLowerResult = await enforcer.enforce(Role.ADMIN, Resource.DOCKER, 'read:any');
            expect(adminLowerResult).toBe(true);

            const viewerLowerResult = await enforcer.enforce(Role.VIEWER, Resource.DOCKER, 'read:any');
            expect(viewerLowerResult).toBe(true);

            // For non-wildcard roles, uppercase actions won't match
            const viewerUpperResult = await enforcer.enforce(Role.VIEWER, Resource.DOCKER, 'READ:ANY');
            expect(viewerUpperResult).toBe(false);

            // Mixed case won't match for VIEWER either
            const viewerMixedResult = await enforcer.enforce(Role.VIEWER, Resource.DOCKER, 'Read:Any');
            expect(viewerMixedResult).toBe(false);

            // GUEST also requires exact lowercase
            const guestUpperResult = await enforcer.enforce(Role.GUEST, Resource.ME, 'READ:ANY');
            expect(guestUpperResult).toBe(false);

            const guestLowerResult = await enforcer.enforce(Role.GUEST, Resource.ME, 'read:any');
            expect(guestLowerResult).toBe(true);
        });

        it('should allow wildcard actions for ADMIN regardless of case', async () => {
            // ADMIN has wildcard permissions (*, *, *) which match any action
            const adminWildcardActions = [
                'read:any',
                'create:any',
                'update:any',
                'delete:any',
                'READ:ANY', // Even uppercase works due to wildcard
                'ANYTHING', // Any action works due to wildcard
            ];

            for (const action of adminWildcardActions) {
                const result = await enforcer.enforce(Role.ADMIN, Resource.DOCKER, action);
                expect(result).toBe(true);
            }
        });

        it('should NOT match different actions even with correct case', async () => {
            // VIEWER should not be able to UPDATE even with correct lowercase
            const result = await enforcer.enforce(Role.VIEWER, Resource.DOCKER, 'update:any');
            expect(result).toBe(false);

            // VIEWER should not be able to DELETE
            const deleteResult = await enforcer.enforce(Role.VIEWER, Resource.DOCKER, 'delete:any');
            expect(deleteResult).toBe(false);

            // VIEWER should not be able to CREATE
            const createResult = await enforcer.enforce(Role.VIEWER, Resource.DOCKER, 'create:any');
            expect(createResult).toBe(false);
        });

        it('should ensure actions are normalized when stored', async () => {
            // This test documents that our auth service normalizes actions to lowercase
            // when syncing permissions, ensuring consistency

            // The BASE_POLICY uses AuthAction.READ_ANY which is 'read:any' (lowercase)
            expect(BASE_POLICY).toContain('read:any');
            expect(BASE_POLICY).not.toContain('READ:ANY');

            // All our stored policies should be lowercase
            const policies = await enforcer.getPolicy();
            for (const policy of policies) {
                const action = policy[2]; // Third element is the action
                if (action && action !== '*') {
                    // All non-wildcard actions should be lowercase
                    expect(action).toBe(action.toLowerCase());
                }
            }
        });
    });

    describe('Wildcard permissions', () => {
        let enforcer: any;

        beforeEach(async () => {
            const model = new CasbinModel();
            model.loadModelFromText(CASBIN_MODEL);
            const adapter = new StringAdapter(BASE_POLICY);
            enforcer = await newEnforcer(model, adapter);
        });

        it('should allow ADMIN wildcard access to all resources and actions', async () => {
            const resources = Object.values(Resource);
            const actions = ['read:any', 'create:any', 'update:any', 'delete:any'];

            for (const resource of resources) {
                for (const action of actions) {
                    const result = await enforcer.enforce(Role.ADMIN, resource, action);
                    expect(result).toBe(true);
                }
            }
        });

        it('should allow CONNECT wildcard read access but not write', async () => {
            const resources = Object.values(Resource).filter(
                (r) => r !== Resource.CONNECT__REMOTE_ACCESS
            );

            for (const resource of resources) {
                // Should be able to read
                const readResult = await enforcer.enforce(Role.CONNECT, resource, 'read:any');
                expect(readResult).toBe(true);

                // Should NOT be able to write (except CONNECT__REMOTE_ACCESS)
                const updateResult = await enforcer.enforce(Role.CONNECT, resource, 'update:any');
                expect(updateResult).toBe(false);
            }

            // Special case: CONNECT can update CONNECT__REMOTE_ACCESS
            const remoteAccessUpdate = await enforcer.enforce(
                Role.CONNECT,
                Resource.CONNECT__REMOTE_ACCESS,
                'update:any'
            );
            expect(remoteAccessUpdate).toBe(true);
        });
    });

    describe('Role inheritance', () => {
        let enforcer: any;

        beforeEach(async () => {
            const model = new CasbinModel();
            model.loadModelFromText(CASBIN_MODEL);
            const adapter = new StringAdapter(BASE_POLICY);
            enforcer = await newEnforcer(model, adapter);
        });

        it('should inherit GUEST permissions for VIEWER', async () => {
            // VIEWER inherits from GUEST, so should have ME access
            const result = await enforcer.enforce(Role.VIEWER, Resource.ME, 'read:any');
            expect(result).toBe(true);
        });

        it('should inherit GUEST permissions for CONNECT', async () => {
            // CONNECT inherits from GUEST, so should have ME access
            const result = await enforcer.enforce(Role.CONNECT, Resource.ME, 'read:any');
            expect(result).toBe(true);
        });

        it('should inherit GUEST permissions for ADMIN', async () => {
            // ADMIN inherits from GUEST, so should have ME access
            const result = await enforcer.enforce(Role.ADMIN, Resource.ME, 'read:any');
            expect(result).toBe(true);
        });
    });

    describe('Edge cases and security', () => {
        it('should deny access with empty action', async () => {
            const model = new CasbinModel();
            model.loadModelFromText(CASBIN_MODEL);
            const adapter = new StringAdapter(BASE_POLICY);
            const enforcer = await newEnforcer(model, adapter);

            const result = await enforcer.enforce(Role.VIEWER, Resource.DOCKER, '');
            expect(result).toBe(false);
        });

        it('should deny access with empty resource', async () => {
            const model = new CasbinModel();
            model.loadModelFromText(CASBIN_MODEL);
            const adapter = new StringAdapter(BASE_POLICY);
            const enforcer = await newEnforcer(model, adapter);

            const result = await enforcer.enforce(Role.VIEWER, '', 'read:any');
            expect(result).toBe(false);
        });

        it('should deny access with undefined role', async () => {
            const model = new CasbinModel();
            model.loadModelFromText(CASBIN_MODEL);
            const adapter = new StringAdapter(BASE_POLICY);
            const enforcer = await newEnforcer(model, adapter);

            const result = await enforcer.enforce('UNDEFINED_ROLE', Resource.DOCKER, 'read:any');
            expect(result).toBe(false);
        });

        it('should deny access with malformed action', async () => {
            const model = new CasbinModel();
            model.loadModelFromText(CASBIN_MODEL);
            const adapter = new StringAdapter(BASE_POLICY);
            const enforcer = await newEnforcer(model, adapter);

            const malformedActions = [
                'read', // Missing possession
                ':any', // Missing verb
                'read:', // Empty possession
                'read:own', // Different possession format
                'READ', // Uppercase without possession
            ];

            for (const action of malformedActions) {
                const result = await enforcer.enforce(Role.VIEWER, Resource.DOCKER, action);
                expect(result).toBe(false);
            }
        });
    });
});
