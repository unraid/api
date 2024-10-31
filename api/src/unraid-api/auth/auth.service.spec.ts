import { AuthService } from './auth.service';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { UsersService } from '../users/users.service';
import { CookieService } from './cookie.service';
import { ApiKeyService } from './api-key.service';
import { AuthZService } from 'nest-authz';
import { UnauthorizedException } from '@nestjs/common';
import { type ApiKey, type UserAccount } from '@app/graphql/generated/api/types';
import { newEnforcer } from 'casbin';

describe('AuthService', () => {
    let authService: AuthService;
    let apiKeyService: ApiKeyService;
    let authzService: AuthZService;
    let usersService: UsersService;
    let cookieService: CookieService;

    const mockApiKey: ApiKey = {
        __typename: 'ApiKey',
        id: '10f356da-1e9e-43b8-9028-a26a645539a6',
        key: '73717ca0-8c15-40b9-bcca-8d85656d1438',
        name: 'Test API Key',
        description: 'Test API Key Description',
        roles: ['guest', 'upc'],
        createdAt: new Date().toISOString(),
        expiresAt: 0,
        scopes: {},
        lastUsed: null,
    };

    const mockUser: UserAccount = {
        id: '-1',
        description: 'Test User',
        name: 'test_user',
        roles: 'guest,admin',
    };

    beforeAll(async () => {
        const enforcer = await newEnforcer();

        apiKeyService = new ApiKeyService();
        authzService = new AuthZService(enforcer);
        usersService = new UsersService(apiKeyService);
        cookieService = new CookieService();
        authService = new AuthService(usersService, cookieService, apiKeyService, authzService);
    });

    describe('validateUser', () => {
        it('should validate a valid user', async () => {
            vi.spyOn(usersService, 'findOne').mockReturnValue(mockUser);

            const result = await authService.validateUser('valid-key');

            expect(result).toEqual(mockUser);
        });

        it('should throw UnauthorizedException for invalid user', async () => {
            vi.spyOn(usersService, 'findOne').mockReturnValue(null);

            await expect(authService.validateUser('invalid-key')).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('validateCookies', () => {
        it('should validate valid cookies', async () => {
            vi.spyOn(cookieService, 'hasValidAuthCookie').mockResolvedValue(true);
            vi.spyOn(usersService, 'getSessionUser').mockReturnValue(mockUser);

            const result = await authService.validateCookies({});

            expect(result).toEqual(mockUser);
        });

        it('should throw UnauthorizedException for invalid cookies', async () => {
            vi.spyOn(cookieService, 'hasValidAuthCookie').mockResolvedValue(false);

            await expect(authService.validateCookies({})).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('validateCookiesCasbin', () => {
        it('should validate cookies and ensure user roles', async () => {
            vi.spyOn(cookieService, 'hasValidAuthCookie').mockResolvedValue(true);
            vi.spyOn(usersService, 'getSessionUser').mockReturnValue(mockUser);
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
            const result = await authService.addPermission('admin', 'resource', 'read');

            expect(addPolicySpy).toHaveBeenCalledWith('admin', 'resource', 'read');
            expect(result).toBe(true);
        });
    });

    describe('addRoleToApiKey', () => {
        it('should add role to API key', async () => {
            const apiKey = { ...mockApiKey, roles: ['existing-role'] };

            vi.spyOn(apiKeyService, 'findById').mockResolvedValue(apiKey);

            const saveApiKeySpy = vi.spyOn(apiKeyService, 'saveApiKey').mockResolvedValue();
            const addRoleSpy = vi.spyOn(authzService, 'addRoleForUser');
            const result = await authService.addRoleToApiKey(apiKey.id, 'new-role');

            expect(saveApiKeySpy).toHaveBeenCalled();
            expect(addRoleSpy).toHaveBeenCalledWith(apiKey.id, 'new-role');
            expect(result).toBe(true);
        });

        it('should throw UnauthorizedException for invalid API key', async () => {
            vi.spyOn(apiKeyService, 'findById').mockResolvedValue(null);

            await expect(authService.addRoleToApiKey('invalid-id', 'role')).rejects.toThrow(
                UnauthorizedException
            );
        });
    });

    describe('removeRoleFromApiKey', () => {
        it('should remove role from API key', async () => {
            const apiKey = { ...mockApiKey, roles: ['role-to-remove', 'other-role'] };

            vi.spyOn(apiKeyService, 'findById').mockResolvedValue(apiKey);

            const saveApiKeySpy = vi.spyOn(apiKeyService, 'saveApiKey').mockResolvedValue();
            const deleteRoleSpy = vi.spyOn(authzService, 'deleteRoleForUser');
            const result = await authService.removeRoleFromApiKey(apiKey.id, 'role-to-remove');

            expect(saveApiKeySpy).toHaveBeenCalled();
            expect(deleteRoleSpy).toHaveBeenCalledWith(apiKey.id, 'role-to-remove');
            expect(result).toBe(true);
        });

        it('should throw UnauthorizedException for invalid API key', async () => {
            vi.spyOn(apiKeyService, 'findById').mockResolvedValue(null);

            await expect(authService.removeRoleFromApiKey('invalid-id', 'role')).rejects.toThrow(
                UnauthorizedException
            );
        });
    });
});
