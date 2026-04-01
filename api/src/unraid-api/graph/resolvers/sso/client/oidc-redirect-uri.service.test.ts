import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcRedirectUriService } from '@app/unraid-api/graph/resolvers/sso/client/oidc-redirect-uri.service.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/core/oidc-config.service.js';
import { validateRedirectUri } from '@app/unraid-api/utils/redirect-uri-validator.js';

vi.mock('@app/unraid-api/utils/redirect-uri-validator.js', () => ({
    validateRedirectUri: vi.fn(),
}));

describe('OidcRedirectUriService', () => {
    let service: OidcRedirectUriService;
    let oidcConfig: { getConfig: ReturnType<typeof vi.fn> };

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
        it('returns a callback URI when validation passes', async () => {
            (validateRedirectUri as any).mockReturnValue({
                isValid: true,
                validatedUri: 'https://example.com',
            });

            const result = await service.getRedirectUri('https://example.com', {
                protocol: 'https',
                host: 'example.com',
            });

            expect(result).toBe('https://example.com/graphql/api/auth/oidc/callback');
            expect(validateRedirectUri).toHaveBeenCalledWith(
                'https://example.com',
                'https',
                'example.com',
                expect.anything(),
                ['https://allowed.example.com']
            );
        });

        it('throws when validation fails', async () => {
            (validateRedirectUri as any).mockReturnValue({
                isValid: false,
                reason: 'Origin not allowed',
            });

            await expect(
                service.getRedirectUri('https://evil.com', {
                    protocol: 'https',
                    host: 'example.com',
                })
            ).rejects.toThrow(UnauthorizedException);
        });

        it('passes through missing allowed origins', async () => {
            oidcConfig.getConfig.mockResolvedValue({
                providers: [],
                defaultAllowedOrigins: undefined,
            });

            (validateRedirectUri as any).mockReturnValue({
                isValid: true,
                validatedUri: 'https://example.com',
            });

            const result = await service.getRedirectUri('https://example.com', {
                protocol: 'https',
                host: 'example.com',
            });

            expect(result).toBe('https://example.com/graphql/api/auth/oidc/callback');
            expect(validateRedirectUri).toHaveBeenCalledWith(
                'https://example.com',
                'https',
                'example.com',
                expect.anything(),
                undefined
            );
        });

        it('uses the trusted request origin info provided by Fastify', async () => {
            (validateRedirectUri as any).mockReturnValue({
                isValid: true,
                validatedUri: 'https://nas.domain.com/graphql/api/auth/oidc/callback',
            });

            const result = await service.getRedirectUri(
                'https://nas.domain.com/graphql/api/auth/oidc/callback',
                {
                    protocol: 'https',
                    host: 'nas.domain.com',
                }
            );

            expect(result).toBe('https://nas.domain.com/graphql/api/auth/oidc/callback');
            expect(validateRedirectUri).toHaveBeenCalledWith(
                'https://nas.domain.com/graphql/api/auth/oidc/callback',
                'https',
                'nas.domain.com',
                expect.anything(),
                expect.anything()
            );
        });

        it('allows host values with ports', async () => {
            (validateRedirectUri as any).mockReturnValue({
                isValid: true,
                validatedUri: 'https://example.com',
            });

            const result = await service.getRedirectUri('https://example.com', {
                protocol: 'https',
                host: 'forwarded.example.com:8443',
            });

            expect(result).toBe('https://example.com/graphql/api/auth/oidc/callback');
            expect(validateRedirectUri).toHaveBeenCalledWith(
                'https://example.com',
                'https',
                'forwarded.example.com:8443',
                expect.anything(),
                expect.anything()
            );
        });

        it('throws when URL construction fails after validation', async () => {
            (validateRedirectUri as any).mockReturnValue({
                isValid: true,
                validatedUri: 'invalid-url',
            });

            await expect(
                service.getRedirectUri('https://example.com', {
                    protocol: 'https',
                    host: 'example.com',
                })
            ).rejects.toThrow(UnauthorizedException);
        });
    });
});
