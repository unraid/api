import { newEnforcer } from 'casbin';
import { AuthActionVerb, AuthPossession, AuthZService } from 'nest-authz';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiKey } from '@app/graphql/generated/api/types';
import { ApiKeyWithSecret, Resource, Role } from '@app/graphql/generated/api/types';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service';
import { AuthService } from '@app/unraid-api/auth/auth.service';
import { CookieService } from '@app/unraid-api/auth/cookie.service';

import { AuthResolver } from './auth.resolver';

describe('AuthResolver', () => {
    let resolver: AuthResolver;
    let authService: AuthService;
    let apiKeyService: ApiKeyService;
    let authzService: AuthZService;
    let cookieService: CookieService;

    const mockApiKey: ApiKey = {
        id: 'test-api-id',
        name: 'Test API Key',
        description: 'Test API Key Description',
        roles: [Role.GUEST],
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

    beforeEach(async () => {
        vi.resetAllMocks();

        const enforcer = await newEnforcer();

        apiKeyService = new ApiKeyService();
        authzService = new AuthZService(enforcer);
        cookieService = new CookieService();
        authService = new AuthService(cookieService, apiKeyService, authzService);
        resolver = new AuthResolver(authService, apiKeyService);
    });

    describe('apiKeys', () => {
        it('should return all API keys', async () => {
            const mockApiKeys = [mockApiKey];
            vi.spyOn(apiKeyService, 'findAll').mockResolvedValue(mockApiKeys);

            const result = await resolver.apiKeys();

            expect(result).toEqual(mockApiKeys);
            expect(apiKeyService.findAll).toHaveBeenCalled();
        });
    });

    describe('apiKey', () => {
        it('should return API key by id', async () => {
            vi.spyOn(apiKeyService, 'findById').mockResolvedValue(mockApiKey);

            const result = await resolver.apiKey(mockApiKey.id);

            expect(result).toEqual(mockApiKey);
            expect(apiKeyService.findById).toHaveBeenCalledWith(mockApiKey.id);
        });

        it('should return null if API key not found', async () => {
            vi.spyOn(apiKeyService, 'findById').mockResolvedValue(null);

            const result = await resolver.apiKey('non-existent-id');

            expect(result).toBeNull();
            expect(apiKeyService.findById).toHaveBeenCalled();
        });
    });

    describe('createApiKey', () => {
        it('should create new API key and sync roles', async () => {
            const input = {
                name: 'New API Key',
                description: 'New API Key Description',
                roles: [Role.GUEST],
            };

            vi.spyOn(apiKeyService, 'create').mockResolvedValue(mockApiKeyWithSecret);
            vi.spyOn(authService, 'syncApiKeyRoles').mockResolvedValue();

            const result = await resolver.createApiKey(input);

            expect(result).toEqual(mockApiKeyWithSecret);
            expect(apiKeyService.create).toHaveBeenCalledWith(
                input.name,
                input.description,
                input.roles
            );
            expect(authService.syncApiKeyRoles).toHaveBeenCalledWith(mockApiKey.id, mockApiKey.roles);
        });
    });

    describe('addPermission', () => {
        it('should add permission', async () => {
            const input = {
                action: AuthActionVerb.READ,
                possession: AuthPossession.ANY,
                role: Role.ADMIN,
                resource: Resource.API_KEY,
            };

            vi.spyOn(authService, 'addPermission').mockResolvedValue(true);

            const result = await resolver.addPermission(input);

            expect(result).toBe(true);
            expect(authService.addPermission).toHaveBeenCalledWith(
                AuthActionVerb[input.action],
                AuthPossession[input.possession],
                Resource[input.resource],
                Role[input.role]
            );
        });
    });

    describe('addRoleForUser', () => {
        it('should add role to user', async () => {
            const input = {
                userId: 'user-1',
                role: Role.ADMIN,
            };

            vi.spyOn(authService, 'addRoleToUser').mockResolvedValue(true);

            const result = await resolver.addRoleForUser(input);

            expect(result).toBe(true);
            expect(authService.addRoleToUser).toHaveBeenCalledWith(input.userId, Role[input.role]);
        });
    });

    describe('addRoleForApiKey', () => {
        it('should add role to API key', async () => {
            const input = {
                apiKeyId: mockApiKey.id,
                role: Role.ADMIN,
            };

            vi.spyOn(authService, 'addRoleToApiKey').mockResolvedValue(true);

            const result = await resolver.addRoleForApiKey(input);

            expect(result).toBe(true);
            expect(authService.addRoleToApiKey).toHaveBeenCalledWith(input.apiKeyId, Role[input.role]);
        });
    });

    describe('removeRoleFromApiKey', () => {
        it('should remove role from API key', async () => {
            const input = {
                apiKeyId: mockApiKey.id,
                role: Role.ADMIN,
            };

            vi.spyOn(authService, 'removeRoleFromApiKey').mockResolvedValue(true);

            const result = await resolver.removeRoleFromApiKey(input);

            expect(result).toBe(true);
            expect(authService.removeRoleFromApiKey).toHaveBeenCalledWith(
                input.apiKeyId,
                Role[input.role]
            );
        });
    });
});
