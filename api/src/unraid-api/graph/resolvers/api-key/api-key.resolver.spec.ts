import { Role } from '@unraid/shared/graphql.model.js';
import { newEnforcer } from 'casbin';
import { AuthZService } from 'nest-authz';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import { CookieService } from '@app/unraid-api/auth/cookie.service.js';
import { ApiKey } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';
import { ApiKeyResolver } from '@app/unraid-api/graph/resolvers/api-key/api-key.resolver.js';

describe('ApiKeyResolver', () => {
    let resolver: ApiKeyResolver;
    let authService: AuthService;
    let apiKeyService: ApiKeyService;
    let authzService: AuthZService;
    let cookieService: CookieService;

    const mockApiKey: ApiKey = {
        id: 'test-api-id',
        key: 'test-secret-key',
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
});
