import { Resource, Role } from '@unraid/shared/graphql.model.js';
import { AuthAction } from 'nest-authz';
import { beforeEach, describe, expect, it } from 'vitest';

import {
    ApiKeyFormData,
    ApiKeyFormService,
} from '@app/unraid-api/graph/resolvers/api-key/api-key-form.service.js';

describe('ApiKeyFormService', () => {
    let service: ApiKeyFormService;

    beforeEach(() => {
        service = new ApiKeyFormService();
    });

    describe('convertFormDataToPermissions', () => {
        describe('basic functionality', () => {
            it('should merge roles and custom permissions', () => {
                const formData: ApiKeyFormData = {
                    name: 'Test Key',
                    roles: [Role.ADMIN],
                    customPermissions: [
                        {
                            resources: [Resource.NETWORK],
                            actions: [AuthAction.READ_ANY],
                        },
                    ],
                };

                const result = service.convertFormDataToPermissions(formData);

                expect(result.roles).toEqual([Role.ADMIN]);
                expect(result.permissions).toContainEqual({
                    resource: Resource.NETWORK,
                    actions: [AuthAction.READ_ANY],
                });
            });

            it('should handle only roles when others are not provided', () => {
                const formData: ApiKeyFormData = {
                    name: 'Test Key',
                    roles: [Role.GUEST, Role.USER],
                };

                const result = service.convertFormDataToPermissions(formData);

                expect(result.roles).toEqual([Role.GUEST, Role.USER]);
                expect(result.permissions).toEqual([]);
            });

            it('should handle multiple roles', () => {
                const formData: ApiKeyFormData = {
                    name: 'Test Key',
                    roles: [Role.GUEST, Role.USER, Role.ADMIN],
                };

                const result = service.convertFormDataToPermissions(formData);

                expect(result.roles).toEqual([Role.GUEST, Role.USER, Role.ADMIN]);
                expect(result.permissions).toEqual([]);
            });

            it('should handle only custom permissions when others are not provided', () => {
                const formData: ApiKeyFormData = {
                    name: 'Test Key',
                    customPermissions: [
                        {
                            resources: [Resource.ARRAY, Resource.DISK],
                            actions: [AuthAction.READ_ANY, AuthAction.UPDATE_ANY],
                        },
                    ],
                };

                const result = service.convertFormDataToPermissions(formData);

                expect(result.roles).toEqual([]);
                expect(result.permissions).toContainEqual({
                    resource: Resource.ARRAY,
                    actions: expect.arrayContaining([AuthAction.READ_ANY, AuthAction.UPDATE_ANY]),
                });
                expect(result.permissions).toContainEqual({
                    resource: Resource.DISK,
                    actions: expect.arrayContaining([AuthAction.READ_ANY, AuthAction.UPDATE_ANY]),
                });
            });

            it('should handle empty form data', () => {
                const formData: ApiKeyFormData = {
                    name: 'Test Key',
                };

                const result = service.convertFormDataToPermissions(formData);

                expect(result.roles).toEqual([]);
                expect(result.permissions).toEqual([]);
            });
        });

        describe('custom permissions handling', () => {
            it('should merge custom permissions with same resource', () => {
                const formData: ApiKeyFormData = {
                    name: 'Test Key',
                    customPermissions: [
                        {
                            resources: [Resource.DOCKER],
                            actions: [AuthAction.READ_ANY],
                        },
                        {
                            resources: [Resource.DOCKER],
                            actions: [AuthAction.UPDATE_ANY, AuthAction.DELETE_ANY],
                        },
                    ],
                };

                const result = service.convertFormDataToPermissions(formData);

                expect(result.permissions).toEqual([
                    {
                        resource: Resource.DOCKER,
                        actions: expect.arrayContaining([
                            AuthAction.READ_ANY,
                            AuthAction.UPDATE_ANY,
                            AuthAction.DELETE_ANY,
                        ]),
                    },
                ]);
            });

            it('should deduplicate actions when merging', () => {
                const formData: ApiKeyFormData = {
                    name: 'Test Key',
                    customPermissions: [
                        {
                            resources: [Resource.NETWORK],
                            actions: [AuthAction.READ_ANY, AuthAction.UPDATE_ANY],
                        },
                        {
                            resources: [Resource.NETWORK],
                            actions: [AuthAction.READ_ANY, AuthAction.DELETE_ANY],
                        },
                    ],
                };

                const result = service.convertFormDataToPermissions(formData);

                const networkPermission = result.permissions.find(
                    (p) => p.resource === Resource.NETWORK
                );
                expect(networkPermission?.actions).toHaveLength(3);
                expect(networkPermission?.actions).toContain(AuthAction.READ_ANY);
                expect(networkPermission?.actions).toContain(AuthAction.UPDATE_ANY);
                expect(networkPermission?.actions).toContain(AuthAction.DELETE_ANY);
            });
        });

        describe('edge cases', () => {
            it('should handle resources as non-array in custom permissions', () => {
                const formData: ApiKeyFormData = {
                    name: 'Test Key',
                    customPermissions: [
                        {
                            resources: Resource.DOCKER as any,
                            actions: [AuthAction.READ_ANY],
                        },
                    ],
                };

                const result = service.convertFormDataToPermissions(formData);

                expect(result.permissions).toEqual([
                    {
                        resource: Resource.DOCKER,
                        actions: [AuthAction.READ_ANY],
                    },
                ]);
            });

            it('should handle actions as non-array in custom permissions', () => {
                const formData: ApiKeyFormData = {
                    name: 'Test Key',
                    customPermissions: [
                        {
                            resources: [Resource.DOCKER],
                            actions: AuthAction.READ_ANY as any,
                        },
                    ],
                };

                const result = service.convertFormDataToPermissions(formData);

                expect(result.permissions).toEqual([
                    {
                        resource: Resource.DOCKER,
                        actions: [AuthAction.READ_ANY],
                    },
                ]);
            });

            it('should handle empty arrays gracefully', () => {
                const formData: ApiKeyFormData = {
                    name: 'Test Key',
                    roles: [],
                    permissionGroups: [],
                    customPermissions: [],
                };

                const result = service.convertFormDataToPermissions(formData);

                expect(result.roles).toEqual([]);
                expect(result.permissions).toEqual([]);
            });

            it('should handle both roles and custom permissions together', () => {
                const formData: ApiKeyFormData = {
                    name: 'Test Key',
                    roles: [Role.USER],
                    customPermissions: [
                        {
                            resources: [Resource.DOCKER, Resource.VMS],
                            actions: [AuthAction.READ_ANY],
                        },
                        {
                            resources: [Resource.NETWORK],
                            actions: [AuthAction.READ_ANY, AuthAction.UPDATE_ANY],
                        },
                    ],
                };

                const result = service.convertFormDataToPermissions(formData);

                expect(result.roles).toEqual([Role.USER]);
                expect(result.permissions).toHaveLength(3);
                expect(result.permissions).toContainEqual({
                    resource: Resource.DOCKER,
                    actions: [AuthAction.READ_ANY],
                });
                expect(result.permissions).toContainEqual({
                    resource: Resource.VMS,
                    actions: [AuthAction.READ_ANY],
                });
                expect(result.permissions).toContainEqual({
                    resource: Resource.NETWORK,
                    actions: expect.arrayContaining([AuthAction.READ_ANY, AuthAction.UPDATE_ANY]),
                });
            });
        });
    });
});
