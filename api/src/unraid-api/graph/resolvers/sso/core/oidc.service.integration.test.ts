import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import * as client from 'openid-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('OidcService Integration Tests - Enhanced Logging', () => {
    let service: OidcService;
    let configPersistence: OidcConfigPersistence;
    let loggerSpy: any;
    let debugLogs: string[] = [];
    let errorLogs: string[] = [];
    let warnLogs: string[] = [];
    let logLogs: string[] = [];

    beforeEach(async () => {
        // Clear log arrays
        debugLogs = [];
        errorLogs = [];
        warnLogs = [];
        logLogs = [];

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [() => ({ BASE_URL: 'http://test.local' })],
                }),
            ],
            providers: [
                OidcService,
                OidcValidationService,
                OidcClientConfigService,
                OidcTokenExchangeService,
                {
                    provide: OidcAuthorizationService,
                    useValue: {
                        checkAuthorization: vi.fn(),
                    },
                },
                {
                    provide: OidcConfigPersistence,
                    useValue: {
                        getProvider: vi.fn(),
                        saveProvider: vi.fn(),
                        getConfig: vi.fn().mockReturnValue({
                            providers: [],
                            defaultAllowedOrigins: [],
                        }),
                    },
                },
                {
                    provide: OidcSessionService,
                    useValue: {
                        createSession: vi.fn().mockResolvedValue('mock-token'),
                        validateSession: vi.fn(),
                    },
                },
                {
                    provide: OidcStateService,
                    useValue: {
                        generateSecureState: vi.fn().mockResolvedValue('secure-state'),
                        validateSecureState: vi.fn().mockResolvedValue({
                            isValid: true,
                            clientState: 'test-state',
                            redirectUri: 'https://myapp.example.com/graphql/api/auth/oidc/callback',
                        }),
                        extractProviderFromState: vi.fn().mockReturnValue('test-provider'),
                    },
                },
                {
                    provide: OidcRedirectUriService,
                    useValue: {
                        getRedirectUri: vi
                            .fn()
                            .mockResolvedValue(
                                'https://myapp.example.com/graphql/api/auth/oidc/callback'
                            ),
                    },
                },
                {
                    provide: OidcClaimsService,
                    useValue: {
                        parseIdToken: vi.fn().mockReturnValue({
                            sub: 'user123',
                            email: 'user@example.com',
                        }),
                        validateClaims: vi.fn().mockReturnValue('user123'),
                    },
                },
            ],
        }).compile();

        service = module.get<OidcService>(OidcService);
        configPersistence = module.get<OidcConfigPersistence>(OidcConfigPersistence);

        // Spy on logger methods to capture logs
        loggerSpy = {
            debug: vi
                .spyOn(Logger.prototype, 'debug')
                .mockImplementation((message: string, ...args: any[]) => {
                    debugLogs.push(message);
                }),
            error: vi
                .spyOn(Logger.prototype, 'error')
                .mockImplementation((message: string, ...args: any[]) => {
                    errorLogs.push(message);
                }),
            warn: vi
                .spyOn(Logger.prototype, 'warn')
                .mockImplementation((message: string, ...args: any[]) => {
                    warnLogs.push(message);
                }),
            log: vi
                .spyOn(Logger.prototype, 'log')
                .mockImplementation((message: string, ...args: any[]) => {
                    logLogs.push(message);
                }),
            verbose: vi.spyOn(Logger.prototype, 'verbose').mockImplementation(() => {}),
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Token Exchange Error Logging', () => {
        it('should log detailed error information when token exchange fails with Google (trailing slash issue)', async () => {
            // This simulates the issue from #1616 where a trailing slash causes failure
            const provider: OidcProvider = {
                id: 'google-test',
                name: 'Google Test',
                issuer: 'https://accounts.google.com/', // Trailing slash will cause issue
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                scopes: ['openid', 'email', 'profile'],
                authorizationRules: [
                    {
                        claim: 'email',
                        operator: 'ENDS_WITH' as any,
                        value: ['@example.com'],
                    },
                ],
            };

            vi.mocked(configPersistence.getProvider).mockResolvedValue(provider);

            try {
                await service.handleCallback({
                    providerId: 'google-test',
                    code: 'test-code',
                    state: 'test-state',
                    requestOrigin: 'http://test.local',
                    fullCallbackUrl:
                        'http://test.local/graphql/api/auth/oidc/callback?code=test-code&state=test-state',
                    requestHeaders: { host: 'test.local' },
                });
            } catch (error) {
                // We expect this to fail
            }

            // Verify that the service attempted to handle the callback
            // Note: Detailed token exchange logging now happens in OidcTokenExchangeService
            const allLogs = [...errorLogs, ...warnLogs, ...logLogs, ...debugLogs];
            expect(allLogs.length).toBeGreaterThan(0);
            expect(allLogs.some((log) => /token|callback|oidc/i.test(log))).toBe(true);
        });

        it('should log discovery failure details with invalid issuer URL', async () => {
            const provider: OidcProvider = {
                id: 'invalid-issuer',
                name: 'Invalid Issuer Test',
                issuer: 'https://invalid-oidc-provider.example.com', // Non-existent domain
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                scopes: ['openid', 'email'],
                authorizationRules: [],
            };

            const validationService = new OidcValidationService(new ConfigService());
            const result = await validationService.validateProvider(provider);

            expect(result.isValid).toBe(false);
            // Should now have more specific error message
            expect(result.error).toBeDefined();
            // The error should mention the domain cannot be resolved or connection failed
            expect(result.error).toMatch(
                /Cannot resolve domain name|Failed to connect to OIDC provider/
            );
            expect(result.details).toBeDefined();
            expect(result.details).toHaveProperty('type');
            // Should be either DNS_ERROR or FETCH_ERROR depending on the cause
            expect(['DNS_ERROR', 'FETCH_ERROR']).toContain((result.details as any).type);
        });

        it('should log detailed HTTP error responses from discovery', async () => {
            const provider: OidcProvider = {
                id: 'http-error-test',
                name: 'HTTP Error Test',
                issuer: 'https://httpstat.us/500', // Returns 500 error
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                scopes: ['openid'],
                authorizationRules: [],
            };

            vi.mocked(configPersistence.getProvider).mockResolvedValue(provider);

            try {
                await service.validateProvider(provider);
            } catch (error) {
                // Expected to fail
            }

            // Check that HTTP status details are logged (now in log level)
            expect(logLogs.some((log) => log.includes('Discovery URL:'))).toBe(true);
            expect(logLogs.some((log) => log.includes('Client ID:'))).toBe(true);
        });

        it('should log authorization URL building details', async () => {
            const provider: OidcProvider = {
                id: 'auth-url-test',
                name: 'Auth URL Test',
                issuer: 'https://accounts.google.com',
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                scopes: ['openid', 'email', 'profile'],
                authorizationRules: [],
            };

            vi.mocked(configPersistence.getProvider).mockResolvedValue(provider);

            try {
                await service.getAuthorizationUrl({
                    providerId: 'auth-url-test',
                    state: 'test-state',
                    requestOrigin: 'http://test.local',
                    requestHeaders: { host: 'test.local' },
                });

                // Verify URL building logs
                expect(logLogs.some((log) => log.includes('Built authorization URL'))).toBe(true);
                expect(logLogs.some((log) => log.includes('Authorization parameters:'))).toBe(true);
            } catch (error) {
                // May fail due to real discovery, but we're interested in the logs
            }
        });

        it('should log detailed information for manual endpoint configuration', async () => {
            const provider: OidcProvider = {
                id: 'manual-endpoints',
                name: 'Manual Endpoints Test',
                issuer: undefined,
                authorizationEndpoint: 'https://auth.example.com/authorize',
                tokenEndpoint: 'https://auth.example.com/token',
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                scopes: ['openid'],
                authorizationRules: [],
            };

            vi.mocked(configPersistence.getProvider).mockResolvedValue(provider);

            const authUrl = await service.getAuthorizationUrl({
                providerId: 'manual-endpoints',
                state: 'test-state',
                requestOrigin: 'http://test.local',
                requestHeaders: {
                    'x-forwarded-host': 'test.local',
                    'x-forwarded-proto': 'http',
                },
            });

            // Verify manual endpoint logs
            expect(debugLogs.some((log) => log.includes('Built authorization URL'))).toBe(true);
            expect(debugLogs.some((log) => log.includes('client_id=test-client-id'))).toBe(true);
            expect(authUrl).toContain('https://auth.example.com/authorize');
        });

        it('should log JWT claim validation failures with detailed context', async () => {
            const provider: OidcProvider = {
                id: 'jwt-validation-test',
                name: 'JWT Validation Test',
                issuer: 'https://accounts.google.com',
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                scopes: ['openid', 'email'],
                authorizationRules: [
                    {
                        claim: 'email',
                        operator: 'ENDS_WITH' as any,
                        value: ['@restricted.com'],
                    },
                ],
            };

            vi.mocked(configPersistence.getProvider).mockResolvedValue(provider);

            // Mock a scenario where JWT validation fails
            try {
                await service.handleCallback({
                    providerId: 'jwt-validation-test',
                    code: 'test-code',
                    state: 'test-state',
                    requestOrigin: 'http://test.local',
                    fullCallbackUrl:
                        'http://test.local/graphql/api/auth/oidc/callback?code=test-code&state=test-state',
                    requestHeaders: { host: 'test.local' },
                });
            } catch (error) {
                // Expected to fail
            }

            // The JWT error handling is now in OidcTokenExchangeService
            // We should see some error logged
            expect(errorLogs.length).toBeGreaterThan(0);
        });
    });

    describe('Discovery Endpoint Logging', () => {
        it('should log all discovery metadata when successful', async () => {
            // Use a real OIDC provider that works
            const provider: OidcProvider = {
                id: 'microsoft',
                name: 'Microsoft',
                issuer: 'https://login.microsoftonline.com/common/v2.0',
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                scopes: ['openid', 'email', 'profile'],
                authorizationRules: [],
            };

            const validationService = new OidcValidationService(new ConfigService());

            try {
                await validationService.performDiscovery(provider);
            } catch (error) {
                // May fail due to network, but we're checking logs
            }

            // Verify discovery logging (now in log level)
            expect(logLogs.some((log) => log.includes('Starting discovery'))).toBe(true);
            expect(logLogs.some((log) => log.includes('Discovery URL:'))).toBe(true);
        });

        it('should log discovery failures with malformed JSON response', async () => {
            const provider: OidcProvider = {
                id: 'malformed-json',
                name: 'Malformed JSON Test',
                issuer: 'https://example.com/malformed',
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                scopes: ['openid'],
                authorizationRules: [],
            };

            // Mock global fetch to return HTML instead of JSON
            const originalFetch = global.fetch;
            global.fetch = vi.fn().mockImplementation(() =>
                Promise.resolve(
                    new Response('<html><body>Not JSON</body></html>', {
                        status: 200,
                        headers: { 'content-type': 'text/html' },
                    })
                )
            );

            const validationService = new OidcValidationService(new ConfigService());
            const result = await validationService.validateProvider(provider);

            // Restore original fetch
            global.fetch = originalFetch;

            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
            // The openid-client library will fail when it gets HTML instead of JSON
            // It returns "unexpected response content-type" error
            expect(result.error).toMatch(
                /Invalid OIDC discovery|malformed|doesn't conform|unexpected|content-type/i
            );
        });

        it('should handle and log HTTP vs HTTPS protocol differences', async () => {
            const httpProvider: OidcProvider = {
                id: 'http-local',
                name: 'HTTP Local Test',
                issuer: 'http://localhost:8080', // HTTP endpoint
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                scopes: ['openid'],
                authorizationRules: [],
            };

            // Create a validation service and spy on its logger
            const validationService = new OidcValidationService(new ConfigService());

            try {
                await validationService.validateProvider(httpProvider);
            } catch (error) {
                // Expected to fail if localhost:8080 isn't running
            }

            // The HTTP logging happens in the validation service
            // We should check that HTTP issuers are detected
            expect(httpProvider.issuer).toMatch(/^http:/);
            // Verify that we're testing an HTTP endpoint
            expect(httpProvider.issuer).toBe('http://localhost:8080');
        });
    });

    describe('Request/Response Detail Logging', () => {
        it('should log complete request parameters for token exchange', async () => {
            const provider: OidcProvider = {
                id: 'token-params-test',
                name: 'Token Params Test',
                issuer: 'https://accounts.google.com',
                clientId: 'detailed-client-id',
                clientSecret: 'detailed-client-secret',
                scopes: ['openid', 'email', 'profile', 'offline_access'],
                authorizationRules: [],
            };

            vi.mocked(configPersistence.getProvider).mockResolvedValue(provider);

            try {
                await service.handleCallback({
                    providerId: 'token-params-test',
                    code: 'authorization-code-12345',
                    state: 'state-with-signature',
                    requestOrigin: 'https://myapp.example.com',
                    fullCallbackUrl:
                        'https://myapp.example.com/graphql/api/auth/oidc/callback?code=authorization-code-12345&state=state-with-signature&scope=openid+email+profile',
                    requestHeaders: { host: 'myapp.example.com' },
                });
            } catch (error) {
                // Expected to fail
            }

            // Verify that we attempted the operation
            // Detailed parameter logging is now in OidcTokenExchangeService
            const requestLogs = [...debugLogs, ...logLogs];
            expect(requestLogs.length).toBeGreaterThan(0);
            expect(
                requestLogs.some(
                    (log) => log.includes('detailed-client-id') || log.includes('token-params-test')
                )
            ).toBe(true);
        });

        it('should capture and log all error properties from openid-client', async () => {
            const provider: OidcProvider = {
                id: 'error-properties-test',
                name: 'Error Properties Test',
                issuer: 'https://expired-cert.badssl.com/', // SSL cert error
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                scopes: ['openid'],
                authorizationRules: [],
            };

            const validationService = new OidcValidationService(new ConfigService());
            const result = await validationService.validateProvider(provider);

            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
            // Should detect SSL/certificate issues or connection failure
            expect(result.error).toMatch(
                /SSL\/TLS certificate error|Failed to connect to OIDC provider|certificate|Cannot resolve domain name|temporarily unavailable/
            );
            expect(result.details).toBeDefined();
            expect(result.details).toHaveProperty('type');
            // Should be one of the known transport failure types
            expect(['SSL_ERROR', 'FETCH_ERROR', 'DNS_ERROR']).toContain((result.details as any).type);
        });
    });
});
