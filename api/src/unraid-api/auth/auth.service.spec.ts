import { UnauthorizedException } from '@nestjs/common';

import { AuthAction, Resource, Role } from '@unraid/shared/graphql.model.js';
import { newEnforcer } from 'casbin';
import { AuthZService } from 'nest-authz';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import { CookieService } from '@app/unraid-api/auth/cookie.service.js';
import { LocalSessionService } from '@app/unraid-api/auth/local-session.service.js';
import { ApiKey } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';
import { UserAccount } from '@app/unraid-api/graph/user/user.model.js';
import { FastifyRequest } from '@app/unraid-api/types/fastify.js';

describe('AuthService', () => {
    let authService: AuthService;
    let apiKeyService: ApiKeyService;
    let authzService: AuthZService;
    let cookieService: CookieService;
    let localSessionService: LocalSessionService;

    const mockApiKey: ApiKey = {
        id: 'test-api-id',
        key: 'test-api-key',
        name: 'Test API Key',
        description: 'Test API Key Description',
        roles: [Role.GUEST],
        permissions: [
            {
                resource: Resource.CONNECT,
                actions: [AuthAction.READ_ANY],
            },
        ],
        createdAt: new Date().toISOString(),
    };

    const mockUser: UserAccount = {
        id: '-1',
        description: 'Test User',
        name: 'test_user',
        roles: [Role.GUEST, Role.CONNECT],
    };

    // Mock FastifyRequest object for tests
    const createMockRequest = (overrides = {}) =>
        ({
            headers: { 'x-csrf-token': undefined },
            query: { csrf_token: undefined },
            cookies: {},
            ...overrides,
        }) as FastifyRequest;

    beforeEach(async () => {
        const enforcer = await newEnforcer();

        apiKeyService = new ApiKeyService();
        authzService = new AuthZService(enforcer);
        cookieService = new CookieService();
        localSessionService = {
            validateLocalSession: vi.fn(),
        } as any;
        authService = new AuthService(cookieService, apiKeyService, localSessionService, authzService);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('validateCookiesCasbin', () => {
        it('should validate cookies and ensure user roles', async () => {
            vi.spyOn(cookieService, 'hasValidAuthCookie').mockResolvedValue(true);
            vi.spyOn(authService, 'getSessionUser').mockResolvedValue(mockUser);
            vi.spyOn(authzService, 'getRolesForUser').mockResolvedValue([Role.ADMIN]);
            vi.spyOn(authService, 'validateCsrfToken').mockReturnValue(true);

            const mockRequest = createMockRequest({
                headers: { 'x-csrf-token': 'valid-token' },
            });
            const result = await authService.validateCookiesWithCsrfToken(mockRequest);

            expect(result).toEqual(mockUser);
        });

        it('should throw UnauthorizedException when auth cookie is invalid', async () => {
            vi.spyOn(cookieService, 'hasValidAuthCookie').mockResolvedValue(false);
            vi.spyOn(authService, 'validateCsrfToken').mockReturnValue(true);

            const mockRequest = createMockRequest({
                headers: { 'x-csrf-token': 'valid-token' },
            });
            await expect(authService.validateCookiesWithCsrfToken(mockRequest)).rejects.toThrow(
                UnauthorizedException
            );
        });

        it('should validate API key with only permissions (no roles)', async () => {
            const apiKeyWithOnlyPermissions: ApiKey = {
                ...mockApiKey,
                roles: [], // No roles, only permissions
                permissions: [
                    {
                        resource: Resource.DOCKER,
                        actions: [AuthAction.READ_ANY, AuthAction.UPDATE_ANY],
                    },
                    {
                        resource: Resource.VMS,
                        actions: [AuthAction.READ_ANY],
                    },
                ],
            };

            vi.spyOn(apiKeyService, 'findByKey').mockResolvedValue(apiKeyWithOnlyPermissions);
            vi.spyOn(authService, 'syncApiKeyRoles').mockResolvedValue(undefined);
            vi.spyOn(authService, 'syncApiKeyPermissions').mockResolvedValue(undefined);
            vi.spyOn(authzService, 'getRolesForUser').mockResolvedValue([]);

            const result = await authService.validateApiKeyCasbin('test-api-key');

            expect(result).toEqual({
                id: apiKeyWithOnlyPermissions.id,
                name: apiKeyWithOnlyPermissions.name,
                description: apiKeyWithOnlyPermissions.description,
                roles: [],
                permissions: apiKeyWithOnlyPermissions.permissions,
            });
            expect(authService.syncApiKeyRoles).toHaveBeenCalledWith(apiKeyWithOnlyPermissions.id, []);
            expect(authService.syncApiKeyPermissions).toHaveBeenCalledWith(
                apiKeyWithOnlyPermissions.id,
                apiKeyWithOnlyPermissions.permissions
            );
        });

        it('should throw UnauthorizedException when session user is missing', async () => {
            vi.spyOn(cookieService, 'hasValidAuthCookie').mockResolvedValue(true);
            vi.spyOn(authService, 'getSessionUser').mockResolvedValue(null as unknown as UserAccount);
            vi.spyOn(authService, 'validateCsrfToken').mockReturnValue(true);

            const mockRequest = createMockRequest();
            await expect(authService.validateCookiesWithCsrfToken(mockRequest)).rejects.toThrow(
                UnauthorizedException
            );
        });

        it('should add guest role when user has no roles', async () => {
            vi.spyOn(cookieService, 'hasValidAuthCookie').mockResolvedValue(true);
            vi.spyOn(authService, 'getSessionUser').mockResolvedValue(mockUser);
            vi.spyOn(authzService, 'getRolesForUser').mockResolvedValue([]);
            vi.spyOn(authService, 'validateCsrfToken').mockReturnValue(true);

            const addRoleSpy = vi.spyOn(authzService, 'addRoleForUser');
            const mockRequest = createMockRequest();
            const result = await authService.validateCookiesWithCsrfToken(mockRequest);

            expect(result).toEqual(mockUser);
            expect(addRoleSpy).toHaveBeenCalledWith(mockUser.id, Role.GUEST);
        });

        it('should throw UnauthorizedException when CSRF token is invalid', async () => {
            vi.spyOn(authService, 'validateCsrfToken').mockReturnValue(false);

            const mockRequest = createMockRequest({
                headers: { 'x-csrf-token': 'invalid-token' },
            });
            await expect(authService.validateCookiesWithCsrfToken(mockRequest)).rejects.toThrow(
                new UnauthorizedException('Invalid CSRF token')
            );
        });

        it('should accept CSRF token from query parameter', async () => {
            vi.spyOn(cookieService, 'hasValidAuthCookie').mockResolvedValue(true);
            vi.spyOn(authService, 'getSessionUser').mockResolvedValue(mockUser);
            vi.spyOn(authzService, 'getRolesForUser').mockResolvedValue([Role.ADMIN]);
            vi.spyOn(authService, 'validateCsrfToken').mockReturnValue(true);

            const mockRequest = createMockRequest({
                query: { csrf_token: 'valid-token' },
            });
            const result = await authService.validateCookiesWithCsrfToken(mockRequest);

            expect(result).toEqual(mockUser);
        });
    });

    describe('syncApiKeyRoles', () => {
        it('should sync roles correctly', async () => {
            const deleteRoleSpy = vi.spyOn(authzService, 'deleteRoleForUser');
            const addRoleSpy = vi.spyOn(authzService, 'addRoleForUser');

            vi.spyOn(authzService, 'getRolesForUser').mockResolvedValue(['old-role']);

            await authService.syncApiKeyRoles('test-id', ['new-role']);

            expect(deleteRoleSpy).toHaveBeenCalledWith('test-id', 'old-role');
            expect(addRoleSpy).toHaveBeenCalledWith('test-id', 'new-role');
        });

        it('should handle failed role deletion', async () => {
            vi.spyOn(authzService, 'getRolesForUser').mockResolvedValue(['old-role']);
            vi.spyOn(authzService, 'deleteRoleForUser').mockRejectedValue(
                new Error('Failed to delete role')
            );

            await expect(authService.syncApiKeyRoles('test-id', ['new-role'])).rejects.toThrow(
                'Failed to delete role'
            );
        });

        it('should handle failed role addition', async () => {
            vi.spyOn(authzService, 'getRolesForUser').mockResolvedValue(['old-role']);
            vi.spyOn(authzService, 'deleteRoleForUser').mockResolvedValue(true);
            vi.spyOn(authzService, 'addRoleForUser').mockRejectedValue(new Error('Failed to add role'));

            await expect(authService.syncApiKeyRoles('test-id', ['new-role'])).rejects.toThrow(
                'Failed to add role'
            );
        });
    });

    describe('addRoleToApiKey', () => {
        it('should add role to API key', async () => {
            const apiKeyId = 'test-id';
            const role = Role.GUEST;

            const mockApiKeyWithoutRole = {
                ...mockApiKey,
                roles: [Role.ADMIN],
            };

            vi.spyOn(apiKeyService, 'findById').mockResolvedValue(mockApiKeyWithoutRole);
            vi.spyOn(apiKeyService, 'findByIdWithSecret').mockResolvedValue({
                ...mockApiKey,
                roles: [Role.ADMIN],
            });
            vi.spyOn(apiKeyService, 'saveApiKey').mockResolvedValue();
            vi.spyOn(authzService, 'addRoleForUser').mockResolvedValue(true);

            const result = await authService.addRoleToApiKey(apiKeyId, role);

            expect(result).toBe(true);
            expect(apiKeyService.findById).toHaveBeenCalledWith(apiKeyId);
            expect(apiKeyService.findByIdWithSecret).toHaveBeenCalledWith(apiKeyId);
            expect(apiKeyService.saveApiKey).toHaveBeenCalledWith({
                ...mockApiKey,
                roles: [Role.ADMIN, role],
            });
            expect(authzService.addRoleForUser).toHaveBeenCalledWith(apiKeyId, role);
        });

        it('should throw UnauthorizedException for invalid API key', async () => {
            vi.spyOn(apiKeyService, 'findById').mockResolvedValue(null);

            await expect(authService.addRoleToApiKey('invalid-id', Role.GUEST)).rejects.toThrow(
                UnauthorizedException
            );
        });
    });

    describe('removeRoleFromApiKey', () => {
        it('should remove role from API key', async () => {
            const apiKey = { ...mockApiKey, roles: [Role.ADMIN, Role.GUEST] };
            const apiKeyWithSecret = {
                ...mockApiKey,
                roles: [Role.ADMIN, Role.GUEST],
            };

            vi.spyOn(apiKeyService, 'findById').mockResolvedValue(apiKey);
            vi.spyOn(apiKeyService, 'findByIdWithSecret').mockResolvedValue(apiKeyWithSecret);
            vi.spyOn(apiKeyService, 'saveApiKey').mockResolvedValue();
            vi.spyOn(authzService, 'deleteRoleForUser').mockResolvedValue(true);

            const result = await authService.removeRoleFromApiKey(apiKey.id, Role.ADMIN);

            expect(result).toBe(true);
            expect(apiKeyService.findById).toHaveBeenCalledWith(apiKey.id);
            expect(apiKeyService.findByIdWithSecret).toHaveBeenCalledWith(apiKey.id);
            expect(apiKeyService.saveApiKey).toHaveBeenCalledWith({
                ...apiKeyWithSecret,
                roles: [Role.GUEST],
            });
            expect(authzService.deleteRoleForUser).toHaveBeenCalledWith(apiKey.id, Role.ADMIN);
        });

        it('should throw UnauthorizedException for invalid API key', async () => {
            vi.spyOn(apiKeyService, 'findById').mockResolvedValue(null);

            await expect(authService.removeRoleFromApiKey('invalid-id', Role.GUEST)).rejects.toThrow(
                UnauthorizedException
            );
        });
    });

    describe('VIEWER role API_KEY access restriction', () => {
        it('should deny VIEWER role access to API_KEY resource', async () => {
            // Test that VIEWER role cannot access API_KEY resource
            const mockCasbinPermissions = Object.values(Resource)
                .filter((resource) => resource !== Resource.API_KEY)
                .map((resource) => ['VIEWER', resource, AuthAction.READ_ANY]);

            vi.spyOn(authzService, 'getImplicitPermissionsForUser').mockResolvedValue(
                mockCasbinPermissions
            );

            const result = await authService.getImplicitPermissionsForRole(Role.VIEWER);

            // VIEWER should have read access to all resources EXCEPT API_KEY
            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBeGreaterThan(0);

            // Should NOT have API_KEY in the permissions
            expect(result.has(Resource.API_KEY)).toBe(false);

            // Should have read access to other resources
            expect(result.get(Resource.DOCKER)).toEqual([AuthAction.READ_ANY]);
            expect(result.get(Resource.ARRAY)).toEqual([AuthAction.READ_ANY]);
            expect(result.get(Resource.CONFIG)).toEqual([AuthAction.READ_ANY]);
            expect(result.get(Resource.ME)).toEqual([AuthAction.READ_ANY]);
        });

        it('should allow ADMIN role access to API_KEY resource', async () => {
            // Test that ADMIN role CAN access API_KEY resource
            const mockCasbinPermissions = [
                ['ADMIN', '*', '*'], // Admin has wildcard access
            ];

            vi.spyOn(authzService, 'getImplicitPermissionsForUser').mockResolvedValue(
                mockCasbinPermissions
            );

            const result = await authService.getImplicitPermissionsForRole(Role.ADMIN);

            // ADMIN should have access to API_KEY through wildcard
            expect(result).toBeInstanceOf(Map);
            expect(result.has(Resource.API_KEY)).toBe(true);
            expect(result.get(Resource.API_KEY)).toContain(AuthAction.CREATE_ANY);
            expect(result.get(Resource.API_KEY)).toContain(AuthAction.READ_ANY);
            expect(result.get(Resource.API_KEY)).toContain(AuthAction.UPDATE_ANY);
            expect(result.get(Resource.API_KEY)).toContain(AuthAction.DELETE_ANY);
        });
    });

    describe('getImplicitPermissionsForRole', () => {
        it('should return permissions for a role', async () => {
            const mockCasbinPermissions = [
                ['ADMIN', 'DOCKER', 'READ'],
                ['ADMIN', 'DOCKER', 'UPDATE'],
                ['ADMIN', 'VMS', 'READ'],
            ];

            vi.spyOn(authzService, 'getImplicitPermissionsForUser').mockResolvedValue(
                mockCasbinPermissions
            );

            const result = await authService.getImplicitPermissionsForRole(Role.ADMIN);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(2);
            expect(result.get(Resource.DOCKER)).toEqual([AuthAction.READ_ANY, AuthAction.UPDATE_ANY]);
            expect(result.get(Resource.VMS)).toEqual([AuthAction.READ_ANY]);
        });

        it('should handle wildcard permissions for admin role', async () => {
            const mockCasbinPermissions = [
                ['ADMIN', '*', '*'],
                ['ADMIN', 'ME', 'READ'], // Inherited from GUEST
            ];

            vi.spyOn(authzService, 'getImplicitPermissionsForUser').mockResolvedValue(
                mockCasbinPermissions
            );

            const result = await authService.getImplicitPermissionsForRole(Role.ADMIN);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBeGreaterThan(0);
            // Should have expanded CRUD actions with proper format for all resources
            expect(result.get(Resource.DOCKER)).toContain(AuthAction.CREATE_ANY);
            expect(result.get(Resource.DOCKER)).toContain(AuthAction.READ_ANY);
            expect(result.get(Resource.DOCKER)).toContain(AuthAction.UPDATE_ANY);
            expect(result.get(Resource.DOCKER)).toContain(AuthAction.DELETE_ANY);
            expect(result.get(Resource.VMS)).toContain(AuthAction.CREATE_ANY);
            expect(result.get(Resource.VMS)).toContain(AuthAction.READ_ANY);
            expect(result.get(Resource.VMS)).toContain(AuthAction.UPDATE_ANY);
            expect(result.get(Resource.VMS)).toContain(AuthAction.DELETE_ANY);
            expect(result.get(Resource.ME)).toContain(AuthAction.READ_ANY);
            expect(result.get(Resource.ME)).toContain(AuthAction.CREATE_ANY); // Also gets CRUD from wildcard
            expect(result.has('*' as any)).toBe(false); // Still shouldn't have literal wildcard
        });

        it('should handle connect role with wildcard resource and specific action', async () => {
            const mockCasbinPermissions = [
                ['CONNECT', '*', 'READ'],
                ['CONNECT', 'CONNECT__REMOTE_ACCESS', 'UPDATE'],
                ['CONNECT', 'ME', 'READ'], // Inherited from GUEST
            ];

            vi.spyOn(authzService, 'getImplicitPermissionsForUser').mockResolvedValue(
                mockCasbinPermissions
            );

            const result = await authService.getImplicitPermissionsForRole(Role.CONNECT);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBeGreaterThan(0);
            // All resources should have READ
            expect(result.get(Resource.DOCKER)).toContain(AuthAction.READ_ANY);
            expect(result.get(Resource.VMS)).toContain(AuthAction.READ_ANY);
            expect(result.get(Resource.ARRAY)).toContain(AuthAction.READ_ANY);
            // CONNECT__REMOTE_ACCESS should have both READ and UPDATE
            expect(result.get(Resource.CONNECT__REMOTE_ACCESS)).toContain(AuthAction.READ_ANY);
            expect(result.get(Resource.CONNECT__REMOTE_ACCESS)).toContain(AuthAction.UPDATE_ANY);
        });

        it('should expand resource-specific wildcard actions to CRUD', async () => {
            const mockCasbinPermissions = [
                ['DOCKER_MANAGER', 'DOCKER', '*'],
                ['DOCKER_MANAGER', 'ARRAY', 'READ'],
            ];

            vi.spyOn(authzService, 'getImplicitPermissionsForUser').mockResolvedValue(
                mockCasbinPermissions
            );

            const result = await authService.getImplicitPermissionsForRole(Role.ADMIN);

            expect(result).toBeInstanceOf(Map);
            // Docker should have all CRUD actions with proper format
            expect(result.get(Resource.DOCKER)).toEqual(
                expect.arrayContaining([
                    AuthAction.CREATE_ANY,
                    AuthAction.READ_ANY,
                    AuthAction.UPDATE_ANY,
                    AuthAction.DELETE_ANY,
                ])
            );
            // Array should only have READ
            expect(result.get(Resource.ARRAY)).toEqual([AuthAction.READ_ANY]);
        });

        it('should skip invalid resources', async () => {
            const mockCasbinPermissions = [
                ['ADMIN', 'INVALID_RESOURCE', 'READ'],
                ['ADMIN', 'DOCKER', 'UPDATE'],
                ['ADMIN', '', 'READ'],
            ] as string[][];

            vi.spyOn(authzService, 'getImplicitPermissionsForUser').mockResolvedValue(
                mockCasbinPermissions
            );

            const result = await authService.getImplicitPermissionsForRole(Role.ADMIN);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(1);
            expect(result.get(Resource.DOCKER)).toEqual([AuthAction.UPDATE_ANY]);
        });

        it('should handle empty permissions', async () => {
            vi.spyOn(authzService, 'getImplicitPermissionsForUser').mockResolvedValue([]);

            const result = await authService.getImplicitPermissionsForRole(Role.ADMIN);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(0);
        });

        it('should handle malformed permission entries', async () => {
            const mockCasbinPermissions = [
                ['ADMIN'], // Too short
                ['ADMIN', 'DOCKER'], // Missing action
                ['ADMIN', 'DOCKER', 'READ', 'EXTRA'], // Extra fields are ok
                ['ADMIN', 'VMS', 'UPDATE'],
            ];

            vi.spyOn(authzService, 'getImplicitPermissionsForUser').mockResolvedValue(
                mockCasbinPermissions
            );

            const result = await authService.getImplicitPermissionsForRole(Role.ADMIN);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(2);
            expect(result.get(Resource.DOCKER)).toEqual([AuthAction.READ_ANY]);
            expect(result.get(Resource.VMS)).toEqual([AuthAction.UPDATE_ANY]);
        });

        it('should not duplicate actions for the same resource', async () => {
            const mockCasbinPermissions = [
                ['ADMIN', 'DOCKER', 'READ'],
                ['ADMIN', 'DOCKER', 'READ'],
                ['ADMIN', 'DOCKER', 'UPDATE'],
                ['ADMIN', 'DOCKER', 'UPDATE'],
            ];

            vi.spyOn(authzService, 'getImplicitPermissionsForUser').mockResolvedValue(
                mockCasbinPermissions
            );

            const result = await authService.getImplicitPermissionsForRole(Role.ADMIN);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(1);
            expect(result.get(Resource.DOCKER)).toEqual([AuthAction.READ_ANY, AuthAction.UPDATE_ANY]);
        });

        it('should handle errors gracefully', async () => {
            vi.spyOn(authzService, 'getImplicitPermissionsForUser').mockRejectedValue(
                new Error('Casbin error')
            );

            const result = await authService.getImplicitPermissionsForRole(Role.ADMIN);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(0);
        });
    });
});
