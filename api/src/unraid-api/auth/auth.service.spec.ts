import { AuthService } from './auth.service';
import { CookieService } from './cookie.service';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiKeyService } from './api-key.service';
import { AuthZService } from 'nest-authz';
import { UnauthorizedException } from '@nestjs/common';
import { Role, type ApiKey, type UserAccount } from '@app/graphql/generated/api/types';
import { newEnforcer } from 'casbin';

describe('AuthService', () => {
    let authService: AuthService;
    let apiKeyService: ApiKeyService;
    let authzService: AuthZService;
    let cookieService: CookieService;

    const mockApiKey: ApiKey = {
        __typename: 'ApiKey',
        id: '10f356da-1e9e-43b8-9028-a26a645539a6',
        name: 'Test API Key',
        description: 'Test API Key Description',
        roles: [Role.GUEST, Role.UPC],
        createdAt: new Date().toISOString(),
        lastUsed: null,
    };

    const mockUser: UserAccount = {
        id: '-1',
        description: 'Test User',
        name: 'test_user',
        roles: [Role.GUEST, Role.UPC],
    };

    beforeEach(async () => {
        const enforcer = await newEnforcer();

        apiKeyService = new ApiKeyService();
        authzService = new AuthZService(enforcer);
        cookieService = new CookieService();
        authService = new AuthService(cookieService, apiKeyService, authzService);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('validateCookiesCasbin', () => {
        it('should validate cookies and ensure user roles', async () => {
            vi.spyOn(cookieService, 'hasValidAuthCookie').mockResolvedValue(true);
            vi.spyOn(authService, 'getSessionUser').mockReturnValue(mockUser);
            vi.spyOn(authzService, 'getRolesForUser').mockResolvedValue(['admin']);

            const result = await authService.validateCookiesCasbin({});

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
    });

    describe('addPermission', () => {
        it('should add permission successfully', async () => {
            const addPolicySpy = vi.spyOn(authzService, 'addPolicy');
            const result = await authService.addPermission(Role.ADMIN, 'resource', 'read');

            expect(addPolicySpy).toHaveBeenCalledWith(Role.ADMIN, 'resource', 'read');
            expect(result).toBe(true);
        });
    });

    describe('addRoleToApiKey', () => {
        it('should add role to API key', async () => {
            const apiKey = { ...mockApiKey, roles: [Role.GUEST] };

            vi.spyOn(apiKeyService, 'findById').mockResolvedValue(apiKey);

            const saveApiKeySpy = vi.spyOn(apiKeyService, 'saveApiKey').mockResolvedValue();
            const addRoleSpy = vi.spyOn(authzService, 'addRoleForUser');
            const result = await authService.addRoleToApiKey(apiKey.id, Role.ADMIN);

            expect(saveApiKeySpy).toHaveBeenCalled();
            expect(addRoleSpy).toHaveBeenCalledWith(apiKey.id, Role.ADMIN);
            expect(result).toBe(true);
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

            vi.spyOn(apiKeyService, 'findById').mockResolvedValue(apiKey);

            const saveApiKeySpy = vi.spyOn(apiKeyService, 'saveApiKey').mockResolvedValue();
            const deleteRoleSpy = vi.spyOn(authzService, 'deleteRoleForUser');
            const result = await authService.removeRoleFromApiKey(apiKey.id, Role.ADMIN);

            expect(saveApiKeySpy).toHaveBeenCalled();
            expect(deleteRoleSpy).toHaveBeenCalledWith(apiKey.id, Role.ADMIN);
            expect(result).toBe(true);
        });

        it('should throw UnauthorizedException for invalid API key', async () => {
            vi.spyOn(apiKeyService, 'findById').mockResolvedValue(null);

            await expect(authService.removeRoleFromApiKey('invalid-id', Role.GUEST)).rejects.toThrow(
                UnauthorizedException
            );
        });
    });
});
