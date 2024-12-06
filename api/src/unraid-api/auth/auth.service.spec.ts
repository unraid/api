import { UnauthorizedException } from '@nestjs/common';

import { newEnforcer } from 'casbin';
import { AuthZService } from 'nest-authz';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiKey, ApiKeyWithSecret, UserAccount } from '@app/graphql/generated/api/types';
import { Role } from '@app/graphql/generated/api/types';

import { ApiKeyService } from './api-key.service';
import { AuthService } from './auth.service';
import { CookieService } from './cookie.service';

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
    };

    const mockApiKeyWithSecret: ApiKeyWithSecret = {
        id: 'test-api-id',
        key: 'test-api-key',
        name: 'Test API Key',
        description: 'Test API Key Description',
        roles: [Role.GUEST],
        createdAt: new Date().toISOString(),
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
            vi.spyOn(authService, 'getSessionUser').mockResolvedValue(mockUser);
            vi.spyOn(authzService, 'getRolesForUser').mockResolvedValue([Role.ADMIN]);

            const result = await authService.validateCookiesCasbin({});

            expect(result).toEqual(mockUser);
        });

        it('should throw UnauthorizedException when auth cookie is invalid', async () => {
            vi.spyOn(cookieService, 'hasValidAuthCookie').mockResolvedValue(false);

            await expect(authService.validateCookiesCasbin({})).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when session user is missing', async () => {
            vi.spyOn(cookieService, 'hasValidAuthCookie').mockResolvedValue(true);
            vi.spyOn(authService, 'getSessionUser').mockResolvedValue(null);

            await expect(authService.validateCookiesCasbin({})).rejects.toThrow(UnauthorizedException);
        });

        it('should add guest role when user has no roles', async () => {
            vi.spyOn(cookieService, 'hasValidAuthCookie').mockResolvedValue(true);
            vi.spyOn(authService, 'getSessionUser').mockResolvedValue(mockUser);
            vi.spyOn(authzService, 'getRolesForUser').mockResolvedValue([]);

            const addRoleSpy = vi.spyOn(authzService, 'addRoleForUser');
            const result = await authService.validateCookiesCasbin({});

            expect(result).toEqual(mockUser);
            expect(addRoleSpy).toHaveBeenCalledWith(mockUser.id, 'guest');
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
                roles: [Role.UPC],
            };

            vi.spyOn(apiKeyService, 'findById').mockResolvedValue(mockApiKeyWithoutRole);
            vi.spyOn(apiKeyService, 'findByIdWithSecret').mockResolvedValue({
                ...mockApiKeyWithSecret,
                roles: [Role.UPC],
            });
            vi.spyOn(apiKeyService, 'saveApiKey').mockResolvedValue();
            vi.spyOn(authzService, 'addRoleForUser').mockResolvedValue(true);

            const result = await authService.addRoleToApiKey(apiKeyId, role);

            expect(result).toBe(true);
            expect(apiKeyService.findById).toHaveBeenCalledWith(apiKeyId);
            expect(apiKeyService.findByIdWithSecret).toHaveBeenCalledWith(apiKeyId);
            expect(apiKeyService.saveApiKey).toHaveBeenCalledWith({
                ...mockApiKeyWithSecret,
                roles: [Role.UPC, role],
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
                ...mockApiKeyWithSecret,
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
});
