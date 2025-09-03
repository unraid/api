import { Logger } from '@nestjs/common';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FastifyRequest } from '@app/unraid-api/types/fastify.js';
import { OidcRequestHandler } from '@app/unraid-api/graph/resolvers/sso/utils/oidc-request-handler.util.js';

describe('OidcRequestHandler', () => {
    let mockLogger: Logger;

    beforeEach(() => {
        vi.clearAllMocks();
        mockLogger = {
            debug: vi.fn(),
            log: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        } as any;
    });

    describe('extractRequestInfo', () => {
        it('should extract request info from headers', () => {
            const mockReq = {
                headers: {
                    'x-forwarded-proto': 'https',
                    'x-forwarded-host': 'example.com:8443',
                },
                protocol: 'http',
                url: '/callback?code=123&state=456',
            } as unknown as FastifyRequest;

            const result = OidcRequestHandler.extractRequestInfo(mockReq);

            expect(result.protocol).toBe('https');
            expect(result.host).toBe('example.com:8443');
            expect(result.fullUrl).toBe('https://example.com:8443/callback?code=123&state=456');
            expect(result.baseUrl).toBe('https://example.com:8443');
        });

        it('should fall back to request properties when headers are missing', () => {
            const mockReq = {
                headers: {
                    host: 'localhost:3000',
                },
                protocol: 'http',
                url: '/callback?code=123&state=456',
            } as FastifyRequest;

            const result = OidcRequestHandler.extractRequestInfo(mockReq);

            expect(result.protocol).toBe('http');
            expect(result.host).toBe('localhost:3000');
            expect(result.fullUrl).toBe('http://localhost:3000/callback?code=123&state=456');
            expect(result.baseUrl).toBe('http://localhost:3000');
        });

        it('should use defaults when all headers are missing', () => {
            const mockReq = {
                headers: {},
                url: '/callback?code=123&state=456',
            } as FastifyRequest;

            const result = OidcRequestHandler.extractRequestInfo(mockReq);

            expect(result.protocol).toBe('http');
            expect(result.host).toBe('localhost:3000');
            expect(result.fullUrl).toBe('http://localhost:3000/callback?code=123&state=456');
            expect(result.baseUrl).toBe('http://localhost:3000');
        });
    });

    describe('validateAuthorizeParams', () => {
        it('should validate valid parameters', () => {
            const result = OidcRequestHandler.validateAuthorizeParams(
                'provider123',
                'state456',
                'https://example.com/callback'
            );

            expect(result.providerId).toBe('provider123');
            expect(result.state).toBe('state456');
            expect(result.redirectUri).toBe('https://example.com/callback');
        });

        it('should throw error for missing provider ID', () => {
            expect(() => {
                OidcRequestHandler.validateAuthorizeParams(
                    undefined,
                    'state456',
                    'https://example.com/callback'
                );
            }).toThrow('Provider ID is required');
        });

        it('should throw error for missing state', () => {
            expect(() => {
                OidcRequestHandler.validateAuthorizeParams(
                    'provider123',
                    undefined,
                    'https://example.com/callback'
                );
            }).toThrow('State parameter is required');
        });

        it('should throw error for missing redirect URI', () => {
            expect(() => {
                OidcRequestHandler.validateAuthorizeParams('provider123', 'state456', undefined);
            }).toThrow('Redirect URI is required');
        });
    });

    describe('validateCallbackParams', () => {
        it('should validate valid parameters', () => {
            const result = OidcRequestHandler.validateCallbackParams('code123', 'state456');

            expect(result.code).toBe('code123');
            expect(result.state).toBe('state456');
        });

        it('should throw error for missing code', () => {
            expect(() => {
                OidcRequestHandler.validateCallbackParams(undefined, 'state456');
            }).toThrow('Missing required parameters');
        });

        it('should throw error for missing state', () => {
            expect(() => {
                OidcRequestHandler.validateCallbackParams('code123', undefined);
            }).toThrow('Missing required parameters');
        });

        it('should throw error for empty code', () => {
            expect(() => {
                OidcRequestHandler.validateCallbackParams('', 'state456');
            }).toThrow('Missing required parameters');
        });

        it('should throw error for empty state', () => {
            expect(() => {
                OidcRequestHandler.validateCallbackParams('code123', '');
            }).toThrow('Missing required parameters');
        });
    });

    describe('handleAuthorize', () => {
        it('should handle authorization flow', async () => {
            const mockAuthService = {
                getAuthorizationUrl: vi
                    .fn()
                    .mockResolvedValue('https://provider.com/auth?client_id=123'),
            };

            const mockReq = {
                headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'example.com' },
                url: '/authorize',
            } as unknown as FastifyRequest;

            const authUrl = await OidcRequestHandler.handleAuthorize(
                'provider123',
                'state456',
                'https://example.com/callback',
                mockReq,
                mockAuthService as any,
                mockLogger
            );

            expect(authUrl).toBe('https://provider.com/auth?client_id=123');
            expect(mockAuthService.getAuthorizationUrl).toHaveBeenCalledWith({
                providerId: 'provider123',
                state: 'state456',
                requestOrigin: 'https://example.com/callback',
                requestHeaders: {
                    'x-forwarded-proto': 'https',
                    'x-forwarded-host': 'example.com',
                },
            });
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'Authorization request - Provider: provider123'
            );
            expect(mockLogger.log).toHaveBeenCalledWith(
                'Redirecting to OIDC provider: https://provider.com/auth?client_id=123'
            );
        });
    });

    describe('handleCallback', () => {
        it('should handle callback flow', async () => {
            const mockStateService = {
                extractProviderFromState: vi.fn().mockReturnValue('provider123'),
            };

            const mockAuthService = {
                getStateService: vi.fn().mockReturnValue(mockStateService),
                handleCallback: vi.fn().mockResolvedValue('paddedToken123'),
            };

            const mockReq: Pick<FastifyRequest, 'id' | 'headers' | 'url'> = {
                id: '123',
                headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'example.com' },
                url: '/callback?code=123&state=456',
            };

            const result = await OidcRequestHandler.handleCallback(
                'code123',
                'state456',
                mockReq as unknown as FastifyRequest,
                mockAuthService as any,
                mockLogger
            );

            expect(result.providerId).toBe('provider123');
            expect(result.paddedToken).toBe('paddedToken123');
            expect(result.requestInfo.fullUrl).toBe('https://example.com/callback?code=123&state=456');
            expect(mockAuthService.handleCallback).toHaveBeenCalledWith({
                providerId: 'provider123',
                code: 'code123',
                state: 'state456',
                requestOrigin: 'https://example.com',
                fullCallbackUrl: 'https://example.com/callback?code=123&state=456',
                requestHeaders: {
                    'x-forwarded-proto': 'https',
                    'x-forwarded-host': 'example.com',
                },
            });
            expect(mockLogger.debug).toHaveBeenCalledWith('Callback request - Provider: provider123');
        });
    });
});
