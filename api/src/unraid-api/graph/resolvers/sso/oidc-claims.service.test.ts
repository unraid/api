import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { decodeJwt } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    JwtClaims,
    OidcClaimsService,
} from '@app/unraid-api/graph/resolvers/sso/oidc-claims.service.js';

// Mock jose
vi.mock('jose', () => ({
    decodeJwt: vi.fn(),
}));

describe('OidcClaimsService', () => {
    let service: OidcClaimsService;

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [OidcClaimsService],
        }).compile();

        service = module.get<OidcClaimsService>(OidcClaimsService);
    });

    describe('parseIdToken', () => {
        it('should parse valid ID token', () => {
            const mockClaims: JwtClaims = {
                sub: 'user123',
                email: 'user@example.com',
                name: 'Test User',
                iat: 1234567890,
                exp: 1234567890,
            };

            (decodeJwt as any).mockReturnValue(mockClaims);

            const result = service.parseIdToken('valid.jwt.token');

            expect(result).toEqual(mockClaims);
            expect(decodeJwt).toHaveBeenCalledWith('valid.jwt.token');
        });

        it('should return null when no token provided', () => {
            const result = service.parseIdToken(undefined);
            expect(result).toBeNull();
        });

        it('should return null when token parsing fails', () => {
            (decodeJwt as any).mockImplementation(() => {
                throw new Error('Invalid token');
            });

            const result = service.parseIdToken('invalid.token');
            expect(result).toBeNull();
        });

        it('should handle claims with array values', () => {
            const mockClaims: JwtClaims = {
                sub: 'user123',
                groups: ['admin', 'user'],
                roles: ['role1', 'role2', 'role3'],
            };

            (decodeJwt as any).mockReturnValue(mockClaims);

            const result = service.parseIdToken('token.with.arrays');

            expect(result).toEqual(mockClaims);
        });

        it('should log warning for complex object claims', () => {
            const loggerSpy = vi.spyOn(service['logger'], 'warn');

            const mockClaims: JwtClaims = {
                sub: 'user123',
                complexClaim: {
                    nested: 'value',
                    another: 'field',
                },
            };

            (decodeJwt as any).mockReturnValue(mockClaims);

            service.parseIdToken('token.with.complex');

            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('complex object structure'));
        });

        it('should handle Google-specific claims', () => {
            const mockClaims: JwtClaims = {
                sub: 'google-user-id',
                email: 'user@company.com',
                name: 'Google User',
                hd: 'company.com', // Google hosted domain
            };

            (decodeJwt as any).mockReturnValue(mockClaims);

            const result = service.parseIdToken('google.jwt.token');

            expect(result).toEqual(mockClaims);
            expect(result?.hd).toBe('company.com');
        });
    });

    describe('validateClaims', () => {
        it('should return user sub when claims are valid', () => {
            const claims: JwtClaims = {
                sub: 'user123',
                email: 'user@example.com',
            };

            const result = service.validateClaims(claims);
            expect(result).toBe('user123');
        });

        it('should throw UnauthorizedException when claims are null', () => {
            expect(() => service.validateClaims(null)).toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when sub is missing', () => {
            const claims: JwtClaims = {
                email: 'user@example.com',
                name: 'User',
            };

            expect(() => service.validateClaims(claims)).toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when sub is empty', () => {
            const claims: JwtClaims = {
                sub: '',
                email: 'user@example.com',
            };

            expect(() => service.validateClaims(claims)).toThrow(UnauthorizedException);
        });
    });

    describe('extractUserInfo', () => {
        it('should extract basic user information', () => {
            const claims: JwtClaims = {
                sub: 'user123',
                email: 'user@example.com',
                name: 'Test User',
            };

            const result = service.extractUserInfo(claims);

            expect(result).toEqual({
                sub: 'user123',
                email: 'user@example.com',
                name: 'Test User',
                domain: undefined,
            });
        });

        it('should extract Google hosted domain', () => {
            const claims: JwtClaims = {
                sub: 'google-user',
                email: 'user@company.com',
                name: 'Google User',
                hd: 'company.com',
            };

            const result = service.extractUserInfo(claims);

            expect(result).toEqual({
                sub: 'google-user',
                email: 'user@company.com',
                name: 'Google User',
                domain: 'company.com',
            });
        });

        it('should handle missing optional fields', () => {
            const claims: JwtClaims = {
                sub: 'user123',
            };

            const result = service.extractUserInfo(claims);

            expect(result).toEqual({
                sub: 'user123',
                email: undefined,
                name: undefined,
                domain: undefined,
            });
        });

        it('should ignore extra claims', () => {
            const claims: JwtClaims = {
                sub: 'user123',
                email: 'user@example.com',
                name: 'Test User',
                extra: 'claim',
                another: 'field',
                groups: ['admin'],
            };

            const result = service.extractUserInfo(claims);

            expect(result).toEqual({
                sub: 'user123',
                email: 'user@example.com',
                name: 'Test User',
                domain: undefined,
            });
            expect(result).not.toHaveProperty('extra');
            expect(result).not.toHaveProperty('groups');
        });
    });
});
