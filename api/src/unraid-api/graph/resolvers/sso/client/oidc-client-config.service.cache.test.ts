import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import * as client from 'openid-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcClientConfigService } from '@app/unraid-api/graph/resolvers/sso/client/oidc-client-config.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/core/oidc-validation.service.js';
import { OidcProvider } from '@app/unraid-api/graph/resolvers/sso/models/oidc-provider.model.js';

vi.mock('openid-client');

describe('OidcClientConfigService - Cache Behavior', () => {
    let service: OidcClientConfigService;
    let validationService: OidcValidationService;

    const createMockProvider = (port: number): OidcProvider => ({
        id: 'test-provider',
        name: 'Test Provider',
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        issuer: `http://localhost:${port}`,
        scopes: ['openid', 'profile', 'email'],
        authorizationRules: [],
    });

    const createMockConfiguration = (port: number) => {
        const mockConfig = {
            serverMetadata: vi.fn(() => ({
                issuer: `http://localhost:${port}`,
                authorization_endpoint: `http://localhost:${port}/auth`,
                token_endpoint: `http://localhost:${port}/token`,
                jwks_uri: `http://localhost:${port}/jwks`,
                userinfo_endpoint: `http://localhost:${port}/userinfo`,
            })),
        };
        return mockConfig as unknown as client.Configuration;
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        const mockConfigService = {
            get: vi.fn(),
            set: vi.fn(),
        };

        const module = await Test.createTestingModule({
            providers: [
                OidcClientConfigService,
                OidcValidationService,
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<OidcClientConfigService>(OidcClientConfigService);
        validationService = module.get<OidcValidationService>(OidcValidationService);
    });

    describe('Configuration Caching', () => {
        it('should cache configuration on first call', async () => {
            const provider = createMockProvider(1029);
            const mockConfig = createMockConfiguration(1029);

            vi.spyOn(validationService, 'performDiscovery').mockResolvedValueOnce(mockConfig);

            // First call
            const config1 = await service.getOrCreateConfig(provider);
            expect(validationService.performDiscovery).toHaveBeenCalledTimes(1);
            expect(config1.serverMetadata().issuer).toBe('http://localhost:1029');

            // Second call with same provider ID should use cache
            const config2 = await service.getOrCreateConfig(provider);
            expect(validationService.performDiscovery).toHaveBeenCalledTimes(1);
            expect(config2).toBe(config1);
        });

        it('should return stale cached configuration when issuer changes without cache clear', async () => {
            const provider1029 = createMockProvider(1029);
            const provider1030 = createMockProvider(1030);
            const mockConfig1029 = createMockConfiguration(1029);
            const mockConfig1030 = createMockConfiguration(1030);

            vi.spyOn(validationService, 'performDiscovery')
                .mockResolvedValueOnce(mockConfig1029)
                .mockResolvedValueOnce(mockConfig1030);

            // Initial configuration on port 1029
            const config1 = await service.getOrCreateConfig(provider1029);
            expect(config1.serverMetadata().issuer).toBe('http://localhost:1029');
            expect(config1.serverMetadata().authorization_endpoint).toBe('http://localhost:1029/auth');

            // Update provider to port 1030 (simulating UI change)
            // Without clearing cache, it should still return the old cached config
            const config2 = await service.getOrCreateConfig(provider1030);

            // THIS IS THE BUG: The service returns cached config for port 1029
            // even though the provider now has issuer on port 1030
            expect(config2.serverMetadata().issuer).toBe('http://localhost:1029');
            expect(config2.serverMetadata().authorization_endpoint).toBe('http://localhost:1029/auth');

            // performDiscovery should only be called once because cache is used
            expect(validationService.performDiscovery).toHaveBeenCalledTimes(1);
        });

        it('should return fresh configuration after cache is cleared', async () => {
            const provider1029 = createMockProvider(1029);
            const provider1030 = createMockProvider(1030);
            const mockConfig1029 = createMockConfiguration(1029);
            const mockConfig1030 = createMockConfiguration(1030);

            vi.spyOn(validationService, 'performDiscovery')
                .mockResolvedValueOnce(mockConfig1029)
                .mockResolvedValueOnce(mockConfig1030);

            // Initial configuration on port 1029
            const config1 = await service.getOrCreateConfig(provider1029);
            expect(config1.serverMetadata().issuer).toBe('http://localhost:1029');

            // Clear cache for the provider
            service.clearCache(provider1030.id);

            // Now it should fetch fresh config for port 1030
            const config2 = await service.getOrCreateConfig(provider1030);
            expect(config2.serverMetadata().issuer).toBe('http://localhost:1030');
            expect(config2.serverMetadata().authorization_endpoint).toBe('http://localhost:1030/auth');

            // performDiscovery should be called twice (once for each port)
            expect(validationService.performDiscovery).toHaveBeenCalledTimes(2);
        });

        it('should clear all provider caches when clearCache is called without providerId', async () => {
            const provider1 = { ...createMockProvider(1029), id: 'provider1' };
            const provider2 = { ...createMockProvider(1030), id: 'provider2' };
            const mockConfig1 = createMockConfiguration(1029);
            const mockConfig2 = createMockConfiguration(1030);

            vi.spyOn(validationService, 'performDiscovery')
                .mockResolvedValueOnce(mockConfig1)
                .mockResolvedValueOnce(mockConfig2)
                .mockResolvedValueOnce(mockConfig1)
                .mockResolvedValueOnce(mockConfig2);

            // Cache both providers
            await service.getOrCreateConfig(provider1);
            await service.getOrCreateConfig(provider2);
            expect(service.getCacheSize()).toBe(2);

            // Clear all caches
            service.clearCache();
            expect(service.getCacheSize()).toBe(0);

            // Both should fetch fresh configs
            await service.getOrCreateConfig(provider1);
            await service.getOrCreateConfig(provider2);

            // performDiscovery should be called 4 times total
            expect(validationService.performDiscovery).toHaveBeenCalledTimes(4);
        });
    });

    describe('Manual Configuration Caching', () => {
        it('should cache manual configuration and exhibit same stale cache issue', async () => {
            const provider1029: OidcProvider = {
                id: 'manual-provider',
                name: 'Manual Provider',
                clientId: 'client-id',
                clientSecret: 'secret',
                issuer: '',
                authorizationEndpoint: 'http://localhost:1029/auth',
                tokenEndpoint: 'http://localhost:1029/token',
                scopes: ['openid'],
                authorizationRules: [],
            };

            const provider1030: OidcProvider = {
                ...provider1029,
                authorizationEndpoint: 'http://localhost:1030/auth',
                tokenEndpoint: 'http://localhost:1030/token',
            };

            // Mock the client.Configuration constructor for manual configs
            const mockManualConfig1029 = createMockConfiguration(1029);
            const mockManualConfig1030 = createMockConfiguration(1030);

            let configCallCount = 0;
            vi.mocked(client.Configuration).mockImplementation(() => {
                configCallCount++;
                return configCallCount === 1 ? mockManualConfig1029 : mockManualConfig1030;
            });

            vi.mocked(client.ClientSecretPost).mockReturnValue({} as any);
            vi.mocked(client.allowInsecureRequests).mockImplementation(() => {});

            // First call with port 1029
            const config1 = await service.getOrCreateConfig(provider1029);
            expect(config1.serverMetadata().authorization_endpoint).toBe('http://localhost:1029/auth');

            // Update to port 1030 without clearing cache
            const config2 = await service.getOrCreateConfig(provider1030);

            // BUG: Still returns cached config with port 1029
            expect(config2.serverMetadata().authorization_endpoint).toBe('http://localhost:1029/auth');

            // Clear cache and try again
            service.clearCache(provider1030.id);
            const config3 = await service.getOrCreateConfig(provider1030);

            // Now it should return the updated config
            expect(config3.serverMetadata().authorization_endpoint).toBe('http://localhost:1030/auth');
        });
    });
});
