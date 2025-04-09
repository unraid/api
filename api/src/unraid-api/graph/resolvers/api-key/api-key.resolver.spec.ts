import { newEnforcer } from 'casbin';
import { AuthZService } from 'nest-authz';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiKey, ApiKeyWithSecret } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';
import { Role } from '@app/unraid-api/graph/resolvers/base.model.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import { CookieService } from '@app/unraid-api/auth/cookie.service.js';
import { ApiKeyResolver } from '@app/unraid-api/graph/resolvers/api-key/api-key.resolver.js';

describe('ApiKeyResolver', () => {
    let resolver: ApiKeyResolver;
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
        permissions: [],
    };

    const mockApiKeyWithSecret: ApiKeyWithSecret = {
        id: 'test-api-id',
        key: 'test-api-key',
        name: 'Test API Key',
        description: 'Test API Key Description',
        roles: [Role.GUEST],
        createdAt: new Date().toISOString(),
        permissions: [],
    };

    beforeEach(async () => {
        vi.resetAllMocks();

        const enforcer = await newEnforcer();

        apiKeyService = new ApiKeyService();
        authzService = new AuthZService(enforcer);
        cookieService = new CookieService();
        authService = new AuthService(cookieService, apiKeyService, authzService);
        resolver = new ApiKeyResolver(authService, apiKeyService);
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
                permissions: [],
            };

            vi.spyOn(apiKeyService, 'create').mockResolvedValue(mockApiKeyWithSecret);
            vi.spyOn(authService, 'syncApiKeyRoles').mockResolvedValue();

            const result = await resolver.createApiKey(input);

            expect(result).toEqual(mockApiKeyWithSecret);
            expect(apiKeyService.create).toHaveBeenCalledWith({
                name: input.name,
                description: input.description,
                overwrite: false,
                roles: input.roles,
                permissions: [],
            });
            expect(authService.syncApiKeyRoles).toHaveBeenCalledWith(mockApiKey.id, mockApiKey.roles);
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
