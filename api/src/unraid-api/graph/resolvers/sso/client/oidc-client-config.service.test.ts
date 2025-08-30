import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcClientConfigService } from '@app/unraid-api/graph/resolvers/sso/client/oidc-client-config.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/core/oidc-validation.service.js';
import { OidcProvider } from '@app/unraid-api/graph/resolvers/sso/models/oidc-provider.model.js';

describe('OidcClientConfigService', () => {
    let service: OidcClientConfigService;
    let validationService: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OidcClientConfigService,
                {
                    provide: OidcValidationService,
                    useValue: {
                        performDiscovery: vi.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<OidcClientConfigService>(OidcClientConfigService);
        validationService = module.get(OidcValidationService);
    });

    describe('Manual Configuration', () => {
        it('should create manual configuration when discovery fails but manual endpoints are provided', async () => {
            const provider: OidcProvider = {
                id: 'manual-provider',
                name: 'Manual Provider',
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                issuer: 'https://manual.example.com',
                authorizationEndpoint: 'https://manual.example.com/auth',
                tokenEndpoint: 'https://manual.example.com/token',
                jwksUri: 'https://manual.example.com/jwks',
                scopes: ['openid', 'profile'],
                authorizationRules: [],
            };

            // Mock discovery to fail
            validationService.performDiscovery.mockRejectedValue(new Error('Discovery failed'));

            const config = await service.getOrCreateConfig(provider);

            // Verify the configuration was created with the correct endpoints
            expect(config).toBeDefined();
            expect(config.serverMetadata().authorization_endpoint).toBe(
                'https://manual.example.com/auth'
            );
            expect(config.serverMetadata().token_endpoint).toBe('https://manual.example.com/token');
            expect(config.serverMetadata().jwks_uri).toBe('https://manual.example.com/jwks');
            expect(config.serverMetadata().issuer).toBe('https://manual.example.com');
        });

        it('should create manual configuration with fallback issuer when not provided', async () => {
            const provider: OidcProvider = {
                id: 'manual-provider-no-issuer',
                name: 'Manual Provider No Issuer',
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                issuer: '', // Empty issuer should skip discovery and use manual endpoints
                authorizationEndpoint: 'https://manual.example.com/auth',
                tokenEndpoint: 'https://manual.example.com/token',
                scopes: ['openid', 'profile'],
                authorizationRules: [],
            };

            const config = await service.getOrCreateConfig(provider);

            // Verify the configuration was created with fallback issuer
            expect(config).toBeDefined();
            expect(config.serverMetadata().issuer).toBe('manual-manual-provider-no-issuer');
            expect(config.serverMetadata().authorization_endpoint).toBe(
                'https://manual.example.com/auth'
            );
            expect(config.serverMetadata().token_endpoint).toBe('https://manual.example.com/token');
        });

        it('should handle manual configuration with client secret properly', async () => {
            const provider: OidcProvider = {
                id: 'manual-with-secret',
                name: 'Manual With Secret',
                clientId: 'test-client-id',
                clientSecret: 'secret-123',
                issuer: 'https://manual.example.com',
                authorizationEndpoint: 'https://manual.example.com/auth',
                tokenEndpoint: 'https://manual.example.com/token',
                scopes: ['openid', 'profile'],
                authorizationRules: [],
            };

            // Mock discovery to fail
            validationService.performDiscovery.mockRejectedValue(new Error('Discovery failed'));

            const config = await service.getOrCreateConfig(provider);

            // Verify configuration was created successfully
            expect(config).toBeDefined();
            expect(config.clientMetadata().client_secret).toBe('secret-123');
        });

        it('should handle manual configuration without client secret (public client)', async () => {
            const provider: OidcProvider = {
                id: 'manual-public-client',
                name: 'Manual Public Client',
                clientId: 'public-client-id',
                // No client secret
                issuer: 'https://manual.example.com',
                authorizationEndpoint: 'https://manual.example.com/auth',
                tokenEndpoint: 'https://manual.example.com/token',
                scopes: ['openid', 'profile'],
                authorizationRules: [],
            };

            // Mock discovery to fail
            validationService.performDiscovery.mockRejectedValue(new Error('Discovery failed'));

            const config = await service.getOrCreateConfig(provider);

            // Verify configuration was created successfully
            expect(config).toBeDefined();
            expect(config.clientMetadata().client_secret).toBeUndefined();
        });

        it('should cache configurations', async () => {
            const provider: OidcProvider = {
                id: 'cached-provider',
                name: 'Cached Provider',
                clientId: 'test-client-id',
                issuer: '',
                authorizationEndpoint: 'https://cached.example.com/auth',
                tokenEndpoint: 'https://cached.example.com/token',
                scopes: ['openid'],
                authorizationRules: [],
            };

            // First call
            const config1 = await service.getOrCreateConfig(provider);

            // Second call - should return cached value
            const config2 = await service.getOrCreateConfig(provider);

            // Should be the exact same object
            expect(config1).toBe(config2);
            expect(service.getCacheSize()).toBe(1);
        });

        it('should clear cache for specific provider', async () => {
            const provider: OidcProvider = {
                id: 'provider-to-clear',
                name: 'Provider to Clear',
                clientId: 'test-client-id',
                issuer: '',
                authorizationEndpoint: 'https://clear.example.com/auth',
                tokenEndpoint: 'https://clear.example.com/token',
                scopes: ['openid'],
                authorizationRules: [],
            };

            await service.getOrCreateConfig(provider);
            expect(service.getCacheSize()).toBe(1);

            service.clearCache('provider-to-clear');
            expect(service.getCacheSize()).toBe(0);
        });

        it('should clear entire cache', async () => {
            const provider1: OidcProvider = {
                id: 'provider1',
                name: 'Provider 1',
                clientId: 'client1',
                issuer: '',
                authorizationEndpoint: 'https://p1.example.com/auth',
                tokenEndpoint: 'https://p1.example.com/token',
                scopes: ['openid'],
                authorizationRules: [],
            };

            const provider2: OidcProvider = {
                id: 'provider2',
                name: 'Provider 2',
                clientId: 'client2',
                issuer: '',
                authorizationEndpoint: 'https://p2.example.com/auth',
                tokenEndpoint: 'https://p2.example.com/token',
                scopes: ['openid'],
                authorizationRules: [],
            };

            await service.getOrCreateConfig(provider1);
            await service.getOrCreateConfig(provider2);
            expect(service.getCacheSize()).toBe(2);

            service.clearCache();
            expect(service.getCacheSize()).toBe(0);
        });
    });

    describe('Discovery Configuration', () => {
        it('should use discovery when issuer is provided', async () => {
            const provider: OidcProvider = {
                id: 'discovery-provider',
                name: 'Discovery Provider',
                clientId: 'test-client-id',
                clientSecret: 'test-secret',
                issuer: 'https://discovery.example.com',
                scopes: ['openid', 'profile'],
                authorizationRules: [],
            };

            const mockConfig = {
                serverMetadata: vi.fn().mockReturnValue({
                    issuer: 'https://discovery.example.com',
                    authorization_endpoint: 'https://discovery.example.com/authorize',
                    token_endpoint: 'https://discovery.example.com/token',
                    jwks_uri: 'https://discovery.example.com/.well-known/jwks.json',
                    userinfo_endpoint: 'https://discovery.example.com/userinfo',
                }),
                clientMetadata: vi.fn().mockReturnValue({}),
            };

            validationService.performDiscovery.mockResolvedValue(mockConfig);

            const config = await service.getOrCreateConfig(provider);

            expect(validationService.performDiscovery).toHaveBeenCalledWith(provider, undefined);
            expect(config).toBe(mockConfig);
        });

        it('should allow HTTP for discovery when issuer uses HTTP', async () => {
            const provider: OidcProvider = {
                id: 'http-discovery-provider',
                name: 'HTTP Discovery Provider',
                clientId: 'test-client-id',
                issuer: 'http://discovery.example.com',
                scopes: ['openid'],
                authorizationRules: [],
            };

            const mockConfig = {
                serverMetadata: vi.fn().mockReturnValue({
                    issuer: 'http://discovery.example.com',
                    authorization_endpoint: 'http://discovery.example.com/authorize',
                    token_endpoint: 'http://discovery.example.com/token',
                }),
                clientMetadata: vi.fn().mockReturnValue({}),
            };

            validationService.performDiscovery.mockResolvedValue(mockConfig);

            const config = await service.getOrCreateConfig(provider);

            expect(validationService.performDiscovery).toHaveBeenCalledWith(
                provider,
                expect.objectContaining({
                    execute: expect.any(Array),
                })
            );
            expect(config).toBe(mockConfig);
        });
    });
});
