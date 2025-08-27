import { AuthAction, Resource, Role } from '@unraid/shared/graphql.model.js';
import { Model as CasbinModel, newEnforcer, StringAdapter } from 'casbin';
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
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST, Role.CONNECT],
            },
            {
                resource: Resource.API_KEY,
                action: AuthAction.CREATE_ANY,
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST, Role.CONNECT],
            },
            {
                resource: Resource.API_KEY,
                action: AuthAction.UPDATE_ANY,
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST, Role.CONNECT],
            },
            {
                resource: Resource.API_KEY,
                action: AuthAction.DELETE_ANY,
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST, Role.CONNECT],
            },

            // PERMISSION resource (for listing possible permissions)
            {
                resource: Resource.PERMISSION,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },

            // ARRAY permissions
            {
                resource: Resource.ARRAY,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.ARRAY,
                action: AuthAction.UPDATE_ANY,
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST],
            },

            // CONFIG permissions
            {
                resource: Resource.CONFIG,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.CONFIG,
                action: AuthAction.UPDATE_ANY,
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST, Role.CONNECT],
            },

            // DOCKER permissions
            {
                resource: Resource.DOCKER,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.DOCKER,
                action: AuthAction.UPDATE_ANY,
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST],
            },

            // VMS permissions
            {
                resource: Resource.VMS,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.VMS,
                action: AuthAction.UPDATE_ANY,
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST],
            },

            // FLASH permissions (includes rclone operations)
            {
                resource: Resource.FLASH,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.FLASH,
                action: AuthAction.CREATE_ANY,
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST, Role.CONNECT],
            },
            {
                resource: Resource.FLASH,
                action: AuthAction.DELETE_ANY,
                allowedRoles: [Role.ADMIN],
                deniedRoles: [Role.VIEWER, Role.GUEST, Role.CONNECT],
            },

            // INFO permissions (system information)
            {
                resource: Resource.INFO,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },

            // LOGS permissions
            {
                resource: Resource.LOGS,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },

            // ME permissions (current user info)
            {
                resource: Resource.ME,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT, Role.GUEST],
                deniedRoles: [],
            },

            // NOTIFICATIONS permissions
            {
                resource: Resource.NOTIFICATIONS,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },

            // Other read-only resources for VIEWER
            {
                resource: Resource.DISK,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.DISPLAY,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.ONLINE,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.OWNER,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.REGISTRATION,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.SERVERS,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.SERVICES,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.SHARE,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.VARS,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.CUSTOMIZATIONS,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.ACTIVATION_CODE,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },

            // CONNECT special permission for remote access
            {
                resource: Resource.CONNECT__REMOTE_ACCESS,
                action: AuthAction.READ_ANY,
                allowedRoles: [Role.ADMIN, Role.VIEWER, Role.CONNECT],
                deniedRoles: [Role.GUEST],
            },
            {
                resource: Resource.CONNECT__REMOTE_ACCESS,
                action: AuthAction.UPDATE_ANY,
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

        it('should match actions exactly as stored (uppercase)', async () => {
            // Our policies store actions as uppercase (e.g., 'READ_ANY')
            // The matcher now requires exact matching for security

            // Uppercase actions should work
            const adminUpperResult = await enforcer.enforce(
                Role.ADMIN,
                Resource.DOCKER,
                AuthAction.READ_ANY
            );
            expect(adminUpperResult).toBe(true);

            const viewerUpperResult = await enforcer.enforce(
                Role.VIEWER,
                Resource.DOCKER,
                AuthAction.READ_ANY
            );
            expect(viewerUpperResult).toBe(true);

            // For non-wildcard roles, lowercase actions won't match
            const viewerLowerResult = await enforcer.enforce(Role.VIEWER, Resource.DOCKER, 'read:any');
            expect(viewerLowerResult).toBe(false);

            // Mixed case won't match for VIEWER either
            const viewerMixedResult = await enforcer.enforce(Role.VIEWER, Resource.DOCKER, 'Read_Any');
            expect(viewerMixedResult).toBe(false);

            // GUEST also requires exact lowercase
            const guestUpperResult = await enforcer.enforce(Role.GUEST, Resource.ME, 'READ:ANY');
            expect(guestUpperResult).toBe(false);

            const guestLowerResult = await enforcer.enforce(
                Role.GUEST,
                Resource.ME,
                AuthAction.READ_ANY
            );
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
            const result = await enforcer.enforce(Role.VIEWER, Resource.DOCKER, AuthAction.UPDATE_ANY);
            expect(result).toBe(false);

            // VIEWER should not be able to DELETE
            const deleteResult = await enforcer.enforce(
                Role.VIEWER,
                Resource.DOCKER,
                AuthAction.DELETE_ANY
            );
            expect(deleteResult).toBe(false);

            // VIEWER should not be able to CREATE
            const createResult = await enforcer.enforce(
                Role.VIEWER,
                Resource.DOCKER,
                AuthAction.CREATE_ANY
            );
            expect(createResult).toBe(false);
        });

        it('should ensure actions are normalized when stored', async () => {
            // This test documents that our auth service normalizes actions to uppercase
            // when syncing permissions, ensuring consistency

            // The BASE_POLICY uses AuthAction.READ_ANY which is 'READ_ANY' (uppercase)
            expect(BASE_POLICY).toContain('READ_ANY');
            expect(BASE_POLICY).not.toContain('read:any');

            // All our stored policies should be uppercase
            const policies = await enforcer.getPolicy();
            for (const policy of policies) {
                const action = policy[2]; // Third element is the action
                if (action && action !== '*') {
                    // All non-wildcard actions should be uppercase
                    expect(action).toBe(action.toUpperCase());
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
            const actions = [
                AuthAction.READ_ANY,
                AuthAction.CREATE_ANY,
                AuthAction.UPDATE_ANY,
                AuthAction.DELETE_ANY,
            ];

            for (const resource of resources) {
                for (const action of actions) {
                    const result = await enforcer.enforce(Role.ADMIN, resource, action);
                    expect(result).toBe(true);
                }
            }
        });

        it('should allow CONNECT read access to most resources but NOT API_KEY', async () => {
            const resources = Object.values(Resource).filter(
                (r) => r !== Resource.CONNECT__REMOTE_ACCESS && r !== Resource.API_KEY
            );

            for (const resource of resources) {
                // Should be able to read most resources
                const readResult = await enforcer.enforce(Role.CONNECT, resource, AuthAction.READ_ANY);
                expect(readResult).toBe(true);

                // Should NOT be able to write (except CONNECT__REMOTE_ACCESS)
                const updateResult = await enforcer.enforce(
                    Role.CONNECT,
                    resource,
                    AuthAction.UPDATE_ANY
                );
                expect(updateResult).toBe(false);
            }

            // CONNECT should NOT be able to read API_KEY
            const apiKeyRead = await enforcer.enforce(
                Role.CONNECT,
                Resource.API_KEY,
                AuthAction.READ_ANY
            );
            expect(apiKeyRead).toBe(false);

            // CONNECT should NOT be able to perform any action on API_KEY
            const apiKeyCreate = await enforcer.enforce(
                Role.CONNECT,
                Resource.API_KEY,
                AuthAction.CREATE_ANY
            );
            expect(apiKeyCreate).toBe(false);
            const apiKeyUpdate = await enforcer.enforce(
                Role.CONNECT,
                Resource.API_KEY,
                AuthAction.UPDATE_ANY
            );
            expect(apiKeyUpdate).toBe(false);
            const apiKeyDelete = await enforcer.enforce(
                Role.CONNECT,
                Resource.API_KEY,
                AuthAction.DELETE_ANY
            );
            expect(apiKeyDelete).toBe(false);

            // Special case: CONNECT can update CONNECT__REMOTE_ACCESS
            const remoteAccessUpdate = await enforcer.enforce(
                Role.CONNECT,
                Resource.CONNECT__REMOTE_ACCESS,
                AuthAction.UPDATE_ANY
            );
            expect(remoteAccessUpdate).toBe(true);
        });

        it('should explicitly deny CONNECT role from accessing API_KEY to prevent secret exposure', async () => {
            // CONNECT should NOT be able to read API_KEY (which would expose secrets)
            const apiKeyRead = await enforcer.enforce(
                Role.CONNECT,
                Resource.API_KEY,
                AuthAction.READ_ANY
            );
            expect(apiKeyRead).toBe(false);

            // Verify all API_KEY operations are denied for CONNECT
            const actions = ['create:any', 'read:any', 'update:any', 'delete:any'];
            for (const action of actions) {
                const result = await enforcer.enforce(Role.CONNECT, Resource.API_KEY, action);
                expect(result).toBe(false);
            }

            // Verify ADMIN can still access API_KEY
            const adminApiKeyRead = await enforcer.enforce(
                Role.ADMIN,
                Resource.API_KEY,
                AuthAction.READ_ANY
            );
            expect(adminApiKeyRead).toBe(true);
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
            const result = await enforcer.enforce(Role.VIEWER, Resource.ME, AuthAction.READ_ANY);
            expect(result).toBe(true);
        });

        it('should inherit GUEST permissions for CONNECT', async () => {
            // CONNECT inherits from GUEST, so should have ME access
            const result = await enforcer.enforce(Role.CONNECT, Resource.ME, AuthAction.READ_ANY);
            expect(result).toBe(true);
        });

        it('should inherit GUEST permissions for ADMIN', async () => {
            // ADMIN inherits from GUEST, so should have ME access
            const result = await enforcer.enforce(Role.ADMIN, Resource.ME, AuthAction.READ_ANY);
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

            const result = await enforcer.enforce(Role.VIEWER, '', AuthAction.READ_ANY);
            expect(result).toBe(false);
        });

        it('should deny access with undefined role', async () => {
            const model = new CasbinModel();
            model.loadModelFromText(CASBIN_MODEL);
            const adapter = new StringAdapter(BASE_POLICY);
            const enforcer = await newEnforcer(model, adapter);

            const result = await enforcer.enforce(
                'UNDEFINED_ROLE',
                Resource.DOCKER,
                AuthAction.READ_ANY
            );
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
