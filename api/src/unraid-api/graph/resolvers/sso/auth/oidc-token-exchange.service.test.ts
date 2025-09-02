import { Logger } from '@nestjs/common';

import * as client from 'openid-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcTokenExchangeService } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-token-exchange.service.js';
import { OidcProvider } from '@app/unraid-api/graph/resolvers/sso/models/oidc-provider.model.js';

vi.mock('openid-client', () => ({
    authorizationCodeGrant: vi.fn(),
    allowInsecureRequests: vi.fn(),
}));

describe('OidcTokenExchangeService', () => {
    let service: OidcTokenExchangeService;
    let mockConfig: client.Configuration;
    let mockProvider: OidcProvider;

    beforeEach(() => {
        service = new OidcTokenExchangeService();

        mockConfig = {
            serverMetadata: vi.fn().mockReturnValue({
                issuer: 'https://example.com',
                token_endpoint: 'https://example.com/token',
                response_types_supported: ['code'],
                grant_types_supported: ['authorization_code'],
                token_endpoint_auth_methods_supported: ['client_secret_post'],
            }),
        } as unknown as client.Configuration;

        mockProvider = {
            id: 'test-provider',
            issuer: 'https://example.com',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
        } as OidcProvider;

        vi.clearAllMocks();
    });

    describe('exchangeCodeForTokens', () => {
        it('should handle malformed fullCallbackUrl gracefully', async () => {
            const code = 'test-code';
            const state = 'test-state';
            const redirectUri = 'https://example.com/callback';
            const malformedUrl = 'not://a valid url';

            const mockTokens = {
                access_token: 'test-access-token',
                id_token: 'test-id-token',
            };

            vi.mocked(client.authorizationCodeGrant).mockResolvedValue(mockTokens as any);

            const loggerWarnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
            const loggerDebugSpy = vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});

            const result = await service.exchangeCodeForTokens(
                mockConfig,
                mockProvider,
                code,
                state,
                redirectUri,
                malformedUrl
            );

            expect(result).toEqual(mockTokens);
            expect(loggerWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to parse fullCallbackUrl'),
                expect.any(Error)
            );
            expect(client.authorizationCodeGrant).toHaveBeenCalled();
        });

        it('should handle empty fullCallbackUrl without throwing', async () => {
            const code = 'test-code';
            const state = 'test-state';
            const redirectUri = 'https://example.com/callback';

            const mockTokens = {
                access_token: 'test-access-token',
                id_token: 'test-id-token',
            };

            vi.mocked(client.authorizationCodeGrant).mockResolvedValue(mockTokens as any);

            const loggerWarnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

            const result = await service.exchangeCodeForTokens(
                mockConfig,
                mockProvider,
                code,
                state,
                redirectUri,
                ''
            );

            expect(result).toEqual(mockTokens);
            expect(loggerWarnSpy).not.toHaveBeenCalled();
            expect(client.authorizationCodeGrant).toHaveBeenCalled();
        });

        it('should handle whitespace-only fullCallbackUrl without throwing', async () => {
            const code = 'test-code';
            const state = 'test-state';
            const redirectUri = 'https://example.com/callback';

            const mockTokens = {
                access_token: 'test-access-token',
                id_token: 'test-id-token',
            };

            vi.mocked(client.authorizationCodeGrant).mockResolvedValue(mockTokens as any);

            const loggerWarnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

            const result = await service.exchangeCodeForTokens(
                mockConfig,
                mockProvider,
                code,
                state,
                redirectUri,
                '   '
            );

            expect(result).toEqual(mockTokens);
            expect(loggerWarnSpy).not.toHaveBeenCalled();
            expect(client.authorizationCodeGrant).toHaveBeenCalled();
        });

        it('should copy parameters from valid fullCallbackUrl', async () => {
            const code = 'test-code';
            const state = 'test-state';
            const redirectUri = 'https://example.com/callback';
            const fullCallbackUrl =
                'https://example.com/callback?code=test-code&state=test-state&scope=openid&authuser=0';

            const mockTokens = {
                access_token: 'test-access-token',
                id_token: 'test-id-token',
            };

            vi.mocked(client.authorizationCodeGrant).mockResolvedValue(mockTokens as any);

            const loggerWarnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
            const loggerDebugSpy = vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});

            const result = await service.exchangeCodeForTokens(
                mockConfig,
                mockProvider,
                code,
                state,
                redirectUri,
                fullCallbackUrl
            );

            expect(result).toEqual(mockTokens);
            expect(loggerWarnSpy).not.toHaveBeenCalled();

            const authCodeGrantCall = vi.mocked(client.authorizationCodeGrant).mock.calls[0];
            const cleanUrl = authCodeGrantCall[1] as URL;

            expect(cleanUrl.searchParams.get('scope')).toBe('openid');
            expect(cleanUrl.searchParams.get('authuser')).toBe('0');
        });

        it('should handle undefined fullCallbackUrl', async () => {
            const code = 'test-code';
            const state = 'test-state';
            const redirectUri = 'https://example.com/callback';

            const mockTokens = {
                access_token: 'test-access-token',
                id_token: 'test-id-token',
            };

            vi.mocked(client.authorizationCodeGrant).mockResolvedValue(mockTokens as any);

            const loggerWarnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

            const result = await service.exchangeCodeForTokens(
                mockConfig,
                mockProvider,
                code,
                state,
                redirectUri,
                undefined
            );

            expect(result).toEqual(mockTokens);
            expect(loggerWarnSpy).not.toHaveBeenCalled();
            expect(client.authorizationCodeGrant).toHaveBeenCalled();
        });

        it('should handle non-string fullCallbackUrl types gracefully', async () => {
            const code = 'test-code';
            const state = 'test-state';
            const redirectUri = 'https://example.com/callback';

            const mockTokens = {
                access_token: 'test-access-token',
                id_token: 'test-id-token',
            };

            vi.mocked(client.authorizationCodeGrant).mockResolvedValue(mockTokens as any);

            const loggerWarnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

            const result = await service.exchangeCodeForTokens(
                mockConfig,
                mockProvider,
                code,
                state,
                redirectUri,
                123 as any
            );

            expect(result).toEqual(mockTokens);
            expect(loggerWarnSpy).not.toHaveBeenCalled();
            expect(client.authorizationCodeGrant).toHaveBeenCalled();
        });
    });
});
