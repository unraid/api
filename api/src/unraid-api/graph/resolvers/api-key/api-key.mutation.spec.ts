import { Role } from '@unraid/shared/graphql.model.js';
import { newEnforcer } from 'casbin';
import { AuthZService } from 'nest-authz';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import { CookieService } from '@app/unraid-api/auth/cookie.service.js';
import {
    ApiKey,
    CreateApiKeyInput,
    DeleteApiKeyInput,
} from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';
import { ApiKeyMutationsResolver } from '@app/unraid-api/graph/resolvers/api-key/api-key.mutation.js';

describe('ApiKeyMutationsResolver', () => {
    let resolver: ApiKeyMutationsResolver;
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
        resolver = new ApiKeyMutationsResolver(authService, apiKeyService);
    });

    describe('create', () => {
        it('should create new API key and sync roles', async () => {
            const input: CreateApiKeyInput = {
                name: 'New API Key',
                description: 'New API Key Description',
                roles: [Role.GUEST],
                permissions: [],
            };

            vi.spyOn(apiKeyService, 'create').mockResolvedValue(mockApiKey);
            vi.spyOn(authService, 'syncApiKeyRoles').mockResolvedValue();

            const result = await resolver.create(input);

            expect(result).toEqual(mockApiKey);
            expect(apiKeyService.create).toHaveBeenCalledWith({
                name: input.name,
                description: input.description,
                overwrite: false,
                roles: input.roles,
                permissions: [],
            });
            expect(authService.syncApiKeyRoles).toHaveBeenCalledWith(mockApiKey.id, mockApiKey.roles);
        });

        it('should throw if API key creation fails', async () => {
            const input: CreateApiKeyInput = {
                name: 'Failing API Key',
                description: 'Should fail',
                roles: [Role.GUEST],
                permissions: [],
            };
            vi.spyOn(apiKeyService, 'create').mockRejectedValue(new Error('Create failed'));
            await expect(resolver.create(input)).rejects.toThrow('Create failed');
        });

        it('should throw if role synchronization fails', async () => {
            const input: CreateApiKeyInput = {
                name: 'Sync Fail API Key',
                description: 'Should fail sync',
                roles: [Role.GUEST],
                permissions: [],
            };
            vi.spyOn(apiKeyService, 'create').mockResolvedValue(mockApiKey);
            vi.spyOn(authService, 'syncApiKeyRoles').mockRejectedValue(new Error('Sync failed'));
            await expect(resolver.create(input)).rejects.toThrow('Sync failed');
        });

        it('should throw if input validation fails (empty name)', async () => {
            const input: CreateApiKeyInput = {
                name: '',
                description: 'No name',
                roles: [Role.GUEST],
                permissions: [],
            };
            await expect(resolver.create(input)).rejects.toThrow();
        });
    });

    describe('delete', () => {
        it('should delete API keys', async () => {
            const input: DeleteApiKeyInput = { ids: [mockApiKey.id] };
            vi.spyOn(apiKeyService, 'deleteApiKeys').mockResolvedValue();

            const result = await resolver.delete(input);

            expect(result).toBe(true);
            expect(apiKeyService.deleteApiKeys).toHaveBeenCalledWith(input.ids);
        });
    });

    describe('addRole', () => {
        it('should add a role to an API key', async () => {
            const input = { apiKeyId: mockApiKey.id, role: Role.ADMIN };
            vi.spyOn(authService, 'addRoleToApiKey').mockResolvedValue(true);

            const result = await resolver.addRole(input);

            expect(result).toBe(true);
            expect(authService.addRoleToApiKey).toHaveBeenCalledWith(input.apiKeyId, input.role);
        });

        it('should throw if addRoleToApiKey throws', async () => {
            const input = { apiKeyId: 'bad-id', role: Role.ADMIN };
            vi.spyOn(authService, 'addRoleToApiKey').mockRejectedValue(new Error('API key not found'));

            await expect(resolver.addRole(input)).rejects.toThrow('API key not found');
        });
    });

    describe('removeRole', () => {
        it('should remove a role from an API key', async () => {
            const input = { apiKeyId: mockApiKey.id, role: Role.GUEST };
            vi.spyOn(authService, 'removeRoleFromApiKey').mockResolvedValue(true);

            const result = await resolver.removeRole(input);

            expect(result).toBe(true);
            expect(authService.removeRoleFromApiKey).toHaveBeenCalledWith(input.apiKeyId, input.role);
        });

        it('should throw if removeRoleFromApiKey throws', async () => {
            const input = { apiKeyId: 'bad-id', role: Role.GUEST };
            vi.spyOn(authService, 'removeRoleFromApiKey').mockRejectedValue(
                new Error('API key not found')
            );

            await expect(resolver.removeRole(input)).rejects.toThrow('API key not found');
        });
    });
});
