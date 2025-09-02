import { CacheModule } from '@nestjs/cache-manager';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcAuthorizationService } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-authorization.service.js';
import { OidcClaimsService } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-claims.service.js';
import { OidcTokenExchangeService } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-token-exchange.service.js';
import { OidcClientConfigService } from '@app/unraid-api/graph/resolvers/sso/client/oidc-client-config.service.js';
import { OidcRedirectUriService } from '@app/unraid-api/graph/resolvers/sso/client/oidc-redirect-uri.service.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/core/oidc-config.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/core/oidc-validation.service.js';
import { OidcService } from '@app/unraid-api/graph/resolvers/sso/core/oidc.service.js';
import { OidcProvider } from '@app/unraid-api/graph/resolvers/sso/models/oidc-provider.model.js';
import { OidcSessionService } from '@app/unraid-api/graph/resolvers/sso/session/oidc-session.service.js';
import { OidcStateService } from '@app/unraid-api/graph/resolvers/sso/session/oidc-state.service.js';

// Mock openid-client
vi.mock('openid-client', () => ({
    buildAuthorizationUrl: vi.fn((config, params) => {
        const url = new URL(config.serverMetadata().authorization_endpoint);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.set(key, String(value));
            }
        });
        return url;
    }),
    allowInsecureRequests: vi.fn(),
}));

describe('OidcService Integration', () => {
    let service: OidcService;
    let oidcConfig: any;
    let sessionService: any;
    let stateService: OidcStateService;
    let redirectUriService: any;
    let clientConfigService: any;
    let tokenExchangeService: any;
    let claimsService: any;
    let authorizationService: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [CacheModule.register()],
            providers: [
                OidcService,
                {
                    provide: OidcConfigPersistence,
                    useValue: {
                        getProvider: vi.fn(),
                        getConfig: vi.fn().mockResolvedValue({
                            providers: [],
                            defaultAllowedOrigins: ['https://example.com'],
                        }),
                    },
                },
                {
                    provide: OidcSessionService,
                    useValue: {
                        createSession: vi.fn().mockResolvedValue('padded-token-123'),
                    },
                },
                OidcStateService,
                {
                    provide: OidcValidationService,
                    useValue: {
                        validateProvider: vi.fn().mockResolvedValue({ isValid: true }),
                        performDiscovery: vi.fn(),
                    },
                },
                {
                    provide: OidcAuthorizationService,
                    useValue: {
                        checkAuthorization: vi.fn(),
                    },
                },
                {
                    provide: OidcRedirectUriService,
                    useValue: {
                        getRedirectUri: vi.fn().mockResolvedValue('https://example.com/callback'),
                    },
                },
                {
                    provide: OidcClientConfigService,
                    useValue: {
                        getOrCreateConfig: vi.fn(),
                        clearCache: vi.fn(),
                    },
                },
                {
                    provide: OidcTokenExchangeService,
                    useValue: {
                        exchangeCodeForTokens: vi.fn(),
                    },
                },
                {
                    provide: OidcClaimsService,
                    useValue: {
                        parseIdToken: vi.fn(),
                        validateClaims: vi.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<OidcService>(OidcService);
        oidcConfig = module.get(OidcConfigPersistence);
        sessionService = module.get(OidcSessionService);
        stateService = module.get<OidcStateService>(OidcStateService);
        redirectUriService = module.get(OidcRedirectUriService);
        clientConfigService = module.get(OidcClientConfigService);
        tokenExchangeService = module.get(OidcTokenExchangeService);
        claimsService = module.get(OidcClaimsService);
        authorizationService = module.get(OidcAuthorizationService);
    });

    describe('getAuthorizationUrl', () => {
        it('should generate authorization URL with custom endpoints', async () => {
            const provider: OidcProvider = {
                id: 'custom-provider',
                name: 'Custom Provider',
                clientId: 'test-client-id',
                clientSecret: 'test-secret',
                authorizationEndpoint: 'https://custom.example.com/auth',
                scopes: ['openid', 'profile'],
                authorizationRules: [],
            };

            oidcConfig.getProvider.mockResolvedValue(provider);

            const params = {
                providerId: 'custom-provider',
                state: 'client-state-123',
                requestOrigin: 'https://example.com',
                requestHeaders: { host: 'example.com' },
            };

            const url = await service.getAuthorizationUrl(params);

            expect(redirectUriService.getRedirectUri).toHaveBeenCalledWith('https://example.com', {
                host: 'example.com',
            });

            const urlObj = new URL(url);
            expect(urlObj.origin).toBe('https://custom.example.com');
            expect(urlObj.pathname).toBe('/auth');
            expect(urlObj.searchParams.get('client_id')).toBe('test-client-id');
            expect(urlObj.searchParams.get('redirect_uri')).toBe('https://example.com/callback');
            expect(urlObj.searchParams.get('scope')).toBe('openid profile');
            expect(urlObj.searchParams.get('response_type')).toBe('code');
            expect(urlObj.searchParams.has('state')).toBe(true);
        });

        it('should use OIDC discovery when no custom authorization endpoint', async () => {
            const provider: OidcProvider = {
                id: 'discovery-provider',
                name: 'Discovery Provider',
                clientId: 'test-client-id',
                issuer: 'https://discovery.example.com',
                scopes: ['openid'],
                authorizationRules: [],
            };

            // Create a mock configuration object
            const mockConfig = {
                serverMetadata: vi.fn().mockReturnValue({
                    authorization_endpoint: 'https://discovery.example.com/authorize',
                }),
            };

            oidcConfig.getProvider.mockResolvedValue(provider);
            clientConfigService.getOrCreateConfig.mockResolvedValue(mockConfig);

            const params = {
                providerId: 'discovery-provider',
                state: 'client-state-123',
                requestOrigin: 'https://example.com',
                requestHeaders: {},
            };

            const url = await service.getAuthorizationUrl(params);

            expect(clientConfigService.getOrCreateConfig).toHaveBeenCalledWith(provider);
            expect(url).toContain('https://discovery.example.com/authorize');
        });

        it('should throw when provider not found', async () => {
            oidcConfig.getProvider.mockResolvedValue(null);

            const params = {
                providerId: 'non-existent',
                state: 'state',
                requestOrigin: 'https://example.com',
                requestHeaders: {},
            };

            await expect(service.getAuthorizationUrl(params)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('handleCallback', () => {
        it('should handle successful callback flow', async () => {
            const provider: OidcProvider = {
                id: 'test-provider',
                name: 'Test Provider',
                clientId: 'test-client-id',
                issuer: 'https://test.example.com',
                scopes: ['openid'],
                authorizationRules: [],
            };

            const mockConfig = {
                serverMetadata: vi.fn().mockReturnValue({
                    issuer: 'https://test.example.com',
                    token_endpoint: 'https://test.example.com/token',
                }),
            };

            const mockTokens = {
                id_token: 'id.token.here',
                access_token: 'access.token.here',
            };

            const mockClaims = {
                sub: 'user123',
                email: 'user@example.com',
            };

            oidcConfig.getProvider.mockResolvedValue(provider);
            clientConfigService.getOrCreateConfig.mockResolvedValue(mockConfig);
            tokenExchangeService.exchangeCodeForTokens.mockResolvedValue(mockTokens);
            claimsService.parseIdToken.mockReturnValue(mockClaims);
            claimsService.validateClaims.mockReturnValue('user123');

            // Mock the OidcStateExtractor's static method
            const OidcStateExtractor = await import(
                '@app/unraid-api/graph/resolvers/sso/session/oidc-state-extractor.util.js'
            );
            vi.spyOn(OidcStateExtractor.OidcStateExtractor, 'extractAndValidateState').mockResolvedValue(
                {
                    providerId: 'test-provider',
                    originalState: 'original-state',
                    clientState: 'original-state',
                    redirectUri: 'https://example.com/callback',
                }
            );

            const params = {
                providerId: 'test-provider',
                code: 'auth-code-123',
                state: 'secure-state',
                requestOrigin: 'https://example.com',
                fullCallbackUrl: 'https://example.com/callback?code=auth-code-123&state=secure-state',
                requestHeaders: {},
            };

            const token = await service.handleCallback(params);

            expect(token).toBe('padded-token-123');
            expect(tokenExchangeService.exchangeCodeForTokens).toHaveBeenCalled();
            expect(claimsService.parseIdToken).toHaveBeenCalledWith('id.token.here');
            expect(claimsService.validateClaims).toHaveBeenCalledWith(mockClaims);
            expect(authorizationService.checkAuthorization).toHaveBeenCalledWith(provider, mockClaims);
            expect(sessionService.createSession).toHaveBeenCalledWith('test-provider', 'user123');
        });

        it('should throw when provider not found', async () => {
            oidcConfig.getProvider.mockResolvedValue(null);

            const params = {
                providerId: 'non-existent',
                code: 'code',
                state: 'state',
                requestOrigin: 'https://example.com',
                fullCallbackUrl: 'https://example.com/callback',
                requestHeaders: {},
            };

            await expect(service.handleCallback(params)).rejects.toThrow(UnauthorizedException);
        });

        it('should handle authorization rejection', async () => {
            const provider: OidcProvider = {
                id: 'test-provider',
                name: 'Test Provider',
                clientId: 'test-client-id',
                issuer: 'https://test.example.com',
                scopes: ['openid'],
                authorizationRules: [],
            };

            const mockConfig = {
                serverMetadata: vi.fn().mockReturnValue({
                    issuer: 'https://test.example.com',
                    token_endpoint: 'https://test.example.com/token',
                }),
            };

            const mockTokens = {
                id_token: 'id.token.here',
            };

            const mockClaims = {
                sub: 'user123',
                email: 'user@example.com',
            };

            oidcConfig.getProvider.mockResolvedValue(provider);
            clientConfigService.getOrCreateConfig.mockResolvedValue(mockConfig);
            tokenExchangeService.exchangeCodeForTokens.mockResolvedValue(mockTokens);
            claimsService.parseIdToken.mockReturnValue(mockClaims);
            claimsService.validateClaims.mockReturnValue('user123');
            authorizationService.checkAuthorization.mockRejectedValue(
                new UnauthorizedException('Not authorized')
            );

            // Mock the OidcStateExtractor's static method
            const OidcStateExtractor = await import(
                '@app/unraid-api/graph/resolvers/sso/session/oidc-state-extractor.util.js'
            );
            vi.spyOn(OidcStateExtractor.OidcStateExtractor, 'extractAndValidateState').mockResolvedValue(
                {
                    providerId: 'test-provider',
                    originalState: 'original-state',
                    clientState: 'original-state',
                    redirectUri: 'https://example.com/callback',
                }
            );

            const params = {
                providerId: 'test-provider',
                code: 'auth-code-123',
                state: 'secure-state',
                requestOrigin: 'https://example.com',
                fullCallbackUrl: 'https://example.com/callback',
                requestHeaders: {},
            };

            await expect(service.handleCallback(params)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('validateProvider', () => {
        it('should clear cache and validate provider', async () => {
            const provider: OidcProvider = {
                id: 'test-provider',
                name: 'Test Provider',
                clientId: 'test-client-id',
                issuer: 'https://test.example.com',
                scopes: ['openid'],
                authorizationRules: [],
            };

            const result = await service.validateProvider(provider);

            expect(clientConfigService.clearCache).toHaveBeenCalledWith('test-provider');
            // The validation service mock already returns { isValid: true }
            expect(result).toEqual({ isValid: true });
        });
    });

    describe('extractProviderFromState', () => {
        it('should extract provider from state', () => {
            const state = 'provider-id:original-state';

            const result = service.extractProviderFromState(state);

            expect(result.providerId).toBeDefined();
            expect(result.originalState).toBeDefined();
        });
    });

    describe('getStateService', () => {
        it('should return state service', () => {
            const result = service.getStateService();
            expect(result).toBe(stateService);
        });
    });
});
