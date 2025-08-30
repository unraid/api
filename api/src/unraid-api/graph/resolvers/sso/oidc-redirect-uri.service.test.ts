import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';
import { OidcRedirectUriService } from '@app/unraid-api/graph/resolvers/sso/oidc-redirect-uri.service.js';
import { validateRedirectUri } from '@app/unraid-api/utils/redirect-uri-validator.js';

// Mock the redirect URI validator
vi.mock('@app/unraid-api/utils/redirect-uri-validator.js', () => ({
    validateRedirectUri: vi.fn(),
}));

describe('OidcRedirectUriService', () => {
    let service: OidcRedirectUriService;
    let oidcConfig: any;

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OidcRedirectUriService,
                {
                    provide: OidcConfigPersistence,
                    useValue: {
                        getConfig: vi.fn().mockResolvedValue({
                            providers: [],
                            defaultAllowedOrigins: ['https://allowed.example.com'],
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<OidcRedirectUriService>(OidcRedirectUriService);
        oidcConfig = module.get(OidcConfigPersistence);
    });

    describe('getRedirectUri', () => {
        it('should return valid redirect URI when validation passes', async () => {
            const requestOrigin = 'https://example.com';
            const requestHeaders = {
                'x-forwarded-proto': 'https',
                'x-forwarded-host': 'example.com',
            };

            (validateRedirectUri as any).mockReturnValue({
                isValid: true,
                validatedUri: 'https://example.com',
            });

            const result = await service.getRedirectUri(requestOrigin, requestHeaders);

            expect(result).toBe('https://example.com/graphql/api/auth/oidc/callback');
            expect(validateRedirectUri).toHaveBeenCalledWith(
                'https://example.com',
                'https',
                'example.com',
                expect.anything(),
                ['https://allowed.example.com']
            );
        });

        it('should throw UnauthorizedException when validation fails', async () => {
            const requestOrigin = 'https://evil.com';
            const requestHeaders = {
                'x-forwarded-proto': 'https',
                'x-forwarded-host': 'example.com',
            };

            (validateRedirectUri as any).mockReturnValue({
                isValid: false,
                reason: 'Origin not allowed',
            });

            await expect(service.getRedirectUri(requestOrigin, requestHeaders)).rejects.toThrow(
                UnauthorizedException
            );
        });

        it('should handle missing allowed origins', async () => {
            oidcConfig.getConfig.mockResolvedValue({
                providers: [],
                defaultAllowedOrigins: undefined,
            });

            const requestOrigin = 'https://example.com';
            const requestHeaders = {
                'x-forwarded-proto': 'https',
                'x-forwarded-host': 'example.com',
            };

            (validateRedirectUri as any).mockReturnValue({
                isValid: true,
                validatedUri: 'https://example.com',
            });

            const result = await service.getRedirectUri(requestOrigin, requestHeaders);

            expect(result).toBe('https://example.com/graphql/api/auth/oidc/callback');
            expect(validateRedirectUri).toHaveBeenCalledWith(
                'https://example.com',
                'https',
                'example.com',
                expect.anything(),
                undefined
            );
        });

        it('should extract protocol from headers correctly', async () => {
            const requestOrigin = 'https://example.com';
            const requestHeaders = {
                'x-forwarded-proto': ['https', 'http'],
                host: 'example.com',
            };

            (validateRedirectUri as any).mockReturnValue({
                isValid: true,
                validatedUri: 'https://example.com',
            });

            const result = await service.getRedirectUri(requestOrigin, requestHeaders);

            expect(result).toBe('https://example.com/graphql/api/auth/oidc/callback');
            expect(validateRedirectUri).toHaveBeenCalledWith(
                'https://example.com',
                'https', // Should use first value from array
                'example.com',
                expect.anything(),
                expect.anything()
            );
        });

        it('should use host header as fallback', async () => {
            const requestOrigin = 'https://example.com';
            const requestHeaders = {
                host: 'example.com',
            };

            (validateRedirectUri as any).mockReturnValue({
                isValid: true,
                validatedUri: 'https://example.com',
            });

            const result = await service.getRedirectUri(requestOrigin, requestHeaders);

            expect(result).toBe('https://example.com/graphql/api/auth/oidc/callback');
            expect(validateRedirectUri).toHaveBeenCalledWith(
                'https://example.com',
                'http', // Default protocol when not specified
                'example.com',
                expect.anything(),
                expect.anything()
            );
        });

        it('should prefer x-forwarded-host over host header', async () => {
            const requestOrigin = 'https://example.com';
            const requestHeaders = {
                'x-forwarded-host': 'forwarded.example.com',
                host: 'original.example.com',
            };

            (validateRedirectUri as any).mockReturnValue({
                isValid: true,
                validatedUri: 'https://example.com',
            });

            const result = await service.getRedirectUri(requestOrigin, requestHeaders);

            expect(result).toBe('https://example.com/graphql/api/auth/oidc/callback');
            expect(validateRedirectUri).toHaveBeenCalledWith(
                'https://example.com',
                'http',
                'forwarded.example.com', // Should use x-forwarded-host
                expect.anything(),
                expect.anything()
            );
        });

        it('should throw when URL construction fails', async () => {
            const requestOrigin = 'https://example.com';
            const requestHeaders = {};

            (validateRedirectUri as any).mockReturnValue({
                isValid: true,
                validatedUri: 'invalid-url', // Invalid URL
            });

            await expect(service.getRedirectUri(requestOrigin, requestHeaders)).rejects.toThrow(
                UnauthorizedException
            );
        });

        it('should handle array values in headers correctly', async () => {
            const requestOrigin = 'https://example.com';
            const requestHeaders = {
                'x-forwarded-proto': ['https'],
                'x-forwarded-host': ['forwarded.example.com', 'another.example.com'],
                host: ['original.example.com'],
            };

            (validateRedirectUri as any).mockReturnValue({
                isValid: true,
                validatedUri: 'https://example.com',
            });

            const result = await service.getRedirectUri(requestOrigin, requestHeaders);

            expect(result).toBe('https://example.com/graphql/api/auth/oidc/callback');
            expect(validateRedirectUri).toHaveBeenCalledWith(
                'https://example.com',
                'https',
                'forwarded.example.com', // Should use first value from array
                expect.anything(),
                expect.anything()
            );
        });
    });
});
