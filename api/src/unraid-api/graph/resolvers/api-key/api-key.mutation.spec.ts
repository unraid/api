import { newEnforcer } from 'casbin';
import { AuthZService } from 'nest-authz';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import { CookieService } from '@app/unraid-api/auth/cookie.service.js';
import { ApiKey, ApiKeyWithSecret } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';
import { ApiKeyMutationsResolver } from '@app/unraid-api/graph/resolvers/api-key/api-key.mutation.js';
import { Role } from '@app/unraid-api/graph/resolvers/base.model.js';

describe('ApiKeyMutationsResolver', () => {
    let resolver: ApiKeyMutationsResolver;
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
        resolver = new ApiKeyMutationsResolver(authService, apiKeyService);
    });

    describe('create', () => {
        it('should create new API key and sync roles', async () => {
            const input = {
                name: 'New API Key',
                description: 'New API Key Description',
                roles: [Role.GUEST],
                permissions: [],
            };

            vi.spyOn(apiKeyService, 'create').mockResolvedValue(mockApiKeyWithSecret);
            vi.spyOn(authService, 'syncApiKeyRoles').mockResolvedValue();

            const result = await resolver.create(input as any);

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

    describe('delete', () => {
        it('should delete API keys', async () => {
            const input = { ids: [mockApiKey.id] };
            vi.spyOn(apiKeyService, 'deleteApiKeys').mockResolvedValue();

            const result = await resolver.delete(input as any);

            expect(result).toBe(true);
            expect(apiKeyService.deleteApiKeys).toHaveBeenCalledWith(input.ids);
        });
    });
});
