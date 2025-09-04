import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as fs from 'fs/promises';

import { UserSettingsService } from '@unraid/shared/services/user-settings.js';
import * as client from 'openid-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcClientConfigService } from '@app/unraid-api/graph/resolvers/sso/client/oidc-client-config.service.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/core/oidc-config.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/core/oidc-validation.service.js';
import { OidcProvider } from '@app/unraid-api/graph/resolvers/sso/models/oidc-provider.model.js';

vi.mock('openid-client');
vi.mock('fs/promises', () => ({
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockRejectedValue(new Error('File not found')),
}));

describe('OIDC Config Cache Fix - Integration Test', () => {
    let configPersistence: OidcConfigPersistence;
    let clientConfigService: OidcClientConfigService;
    let mockConfigService: any;

    afterEach(() => {
        delete process.env.PATHS_CONFIG;
    });

    const createMockProvider = (port: number): OidcProvider => ({
        id: 'test-provider',
        name: 'Test Provider',
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        issuer: `http://localhost:${port}`,
        scopes: ['openid', 'profile', 'email'],
        authorizationRules: [
            {
                claim: 'email',
                operator: 'endsWith' as any,
                value: ['@example.com'],
            },
        ],
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

        // Set environment variable for config path
        process.env.PATHS_CONFIG = '/tmp/test-config';

        mockConfigService = {
            get: vi.fn((key: string) => {
                if (key === 'oidc') {
                    return {
                        providers: [createMockProvider(1029)],
                        defaultAllowedOrigins: [],
                    };
                }
                if (key === 'paths.config') {
                    return '/tmp/test-config';
                }
                return undefined;
            }),
            set: vi.fn(),
            getOrThrow: vi.fn((key: string) => {
                if (key === 'paths.config' || key === 'paths') {
                    return '/tmp/test-config';
                }
                return '/tmp/test-config';
            }),
        };

        const mockUserSettingsService = {
            register: vi.fn(),
            getAllSettings: vi.fn(),
            getAllValues: vi.fn(),
            updateNamespacedValues: vi.fn(),
        };

        const module = await Test.createTestingModule({
            providers: [
                OidcConfigPersistence,
                OidcClientConfigService,
                OidcValidationService,
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: UserSettingsService,
                    useValue: mockUserSettingsService,
                },
            ],
        }).compile();

        configPersistence = module.get<OidcConfigPersistence>(OidcConfigPersistence);
        clientConfigService = module.get<OidcClientConfigService>(OidcClientConfigService);

        // Mock the persist method since we don't want to write to disk in tests
        vi.spyOn(configPersistence as any, 'persist').mockResolvedValue(undefined);
    });

    describe('Cache clearing on provider update', () => {
        it('should clear cache when provider is updated via upsertProvider', async () => {
            const provider1029 = createMockProvider(1029);
            const provider1030 = createMockProvider(1030);
            const mockConfig1029 = createMockConfiguration(1029);
            const mockConfig1030 = createMockConfiguration(1030);

            // Mock validation service to return configs
            const validationService = (configPersistence as any).validationService;
            vi.spyOn(validationService, 'performDiscovery')
                .mockResolvedValueOnce(mockConfig1029)
                .mockResolvedValueOnce(mockConfig1030);

            // First, get config for port 1029 - this caches it
            const config1 = await clientConfigService.getOrCreateConfig(provider1029);
            expect(config1.serverMetadata().issuer).toBe('http://localhost:1029');

            // Spy on clearCache method
            const clearCacheSpy = vi.spyOn(clientConfigService, 'clearCache');

            // Update the provider to port 1030 via upsertProvider
            await configPersistence.upsertProvider(provider1030);

            // Verify cache was cleared for this specific provider
            expect(clearCacheSpy).toHaveBeenCalledWith(provider1030.id);

            // Now get config again - should fetch fresh config for port 1030
            const config2 = await clientConfigService.getOrCreateConfig(provider1030);
            expect(config2.serverMetadata().issuer).toBe('http://localhost:1030');
            expect(config2.serverMetadata().authorization_endpoint).toBe('http://localhost:1030/auth');

            // Verify discovery was called twice (not using cache)
            expect(validationService.performDiscovery).toHaveBeenCalledTimes(2);
        });

        it('should clear cache when provider is deleted', async () => {
            const provider = createMockProvider(1029);
            const mockConfig = createMockConfiguration(1029);

            // Setup initial provider in config
            mockConfigService.get.mockReturnValue({
                providers: [provider, { ...provider, id: 'other-provider' }],
                defaultAllowedOrigins: [],
            });

            // Mock validation service
            const validationService = (configPersistence as any).validationService;
            vi.spyOn(validationService, 'performDiscovery').mockResolvedValue(mockConfig);

            // First, cache the provider config
            await clientConfigService.getOrCreateConfig(provider);

            // Spy on clearCache
            const clearCacheSpy = vi.spyOn(clientConfigService, 'clearCache');

            // Delete the provider
            const deleted = await configPersistence.deleteProvider(provider.id);
            expect(deleted).toBe(true);

            // Verify cache was cleared for the deleted provider
            expect(clearCacheSpy).toHaveBeenCalledWith(provider.id);
        });

        it('should clear all provider caches when updated via settings updateValues', async () => {
            // This simulates what happens when settings are saved through the UI
            const settingsCallback = (configPersistence as any).userSettings.register.mock.calls[0][1];

            const newConfig = {
                providers: [
                    {
                        ...createMockProvider(1030),
                        authorizationMode: 'simple',
                        simpleAuthorization: {
                            allowedDomains: ['example.com'],
                            allowedEmails: [],
                            allowedUserIds: [],
                        },
                    },
                ],
                defaultAllowedOrigins: [],
            };

            // Spy on clearCache
            const clearCacheSpy = vi.spyOn(clientConfigService, 'clearCache');

            // Mock validation
            const validationService = (configPersistence as any).validationService;
            vi.spyOn(validationService, 'validateProvider').mockResolvedValue({
                isValid: true,
            });

            // Call the updateValues function (simulating saving settings from UI)
            await settingsCallback.updateValues(newConfig);

            // Verify cache was cleared (called without arguments to clear all)
            expect(clearCacheSpy).toHaveBeenCalledWith();
        });

        it('should NOT require API restart after updating provider issuer', async () => {
            // This test confirms that the fix eliminates the need for API restart
            const settingsCallback = (configPersistence as any).userSettings.register.mock.calls[0][1];

            const newConfig = {
                providers: [createMockProvider(1030)],
                defaultAllowedOrigins: [],
            };

            // Mock validation
            const validationService = (configPersistence as any).validationService;
            vi.spyOn(validationService, 'validateProvider').mockResolvedValue({
                isValid: true,
            });

            // Update settings
            const result = await settingsCallback.updateValues(newConfig);

            // Verify that restartRequired is false
            expect(result.restartRequired).toBe(false);
        });
    });

    describe('Provider validation on save', () => {
        it('should validate providers and include warnings but still save', async () => {
            const settingsCallback = (configPersistence as any).userSettings.register.mock.calls[0][1];

            const newConfig = {
                providers: [
                    createMockProvider(1030),
                    { ...createMockProvider(1031), id: 'invalid-provider', name: 'Invalid Provider' },
                ],
                defaultAllowedOrigins: [],
            };

            // Mock validation - first provider valid, second invalid
            const validationService = (configPersistence as any).validationService;
            vi.spyOn(validationService, 'validateProvider')
                .mockResolvedValueOnce({ isValid: true })
                .mockResolvedValueOnce({
                    isValid: false,
                    error: 'Discovery failed: Unable to reach issuer',
                });

            // Update settings
            const result = await settingsCallback.updateValues(newConfig);

            // Should save successfully but include warnings
            expect(result.restartRequired).toBe(false);
            expect(result.warnings).toBeDefined();
            expect(result.warnings).toContain(
                '❌ Invalid Provider: Discovery failed: Unable to reach issuer'
            );
            expect(result.values.providers).toHaveLength(2);

            // Cache should still be cleared even with validation warnings
            const clearCacheSpy = vi.spyOn(clientConfigService, 'clearCache');
            await settingsCallback.updateValues(newConfig);
            expect(clearCacheSpy).toHaveBeenCalled();
        });
    });
});
