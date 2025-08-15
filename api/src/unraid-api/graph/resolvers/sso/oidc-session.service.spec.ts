import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';

import type { Cache } from 'cache-manager';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcSessionService } from '@app/unraid-api/graph/resolvers/sso/oidc-session.service.js';

describe('OidcSessionService', () => {
    let service: OidcSessionService;
    let cacheManager: Cache;

    beforeEach(async () => {
        const mockCacheManager = {
            get: vi.fn(),
            set: vi.fn(),
            del: vi.fn(),
        };

        const module = await Test.createTestingModule({
            providers: [
                OidcSessionService,
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
            ],
        }).compile();

        service = module.get<OidcSessionService>(OidcSessionService);
        cacheManager = module.get<Cache>(CACHE_MANAGER);
    });

    describe('one-time token validation', () => {
        it('should validate a token successfully on first attempt', async () => {
            // Create a session
            const token = await service.createSession('test-provider', 'test-user-id');

            // Mock cache get to return the session
            vi.mocked(cacheManager.get).mockResolvedValueOnce({
                id: expect.any(String),
                providerId: 'test-provider',
                providerUserId: 'test-user-id',
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            });

            // First validation should succeed
            const result = await service.validateSession(token);
            expect(result.valid).toBe(true);
            expect(result.username).toBe('root');
            expect(cacheManager.del).toHaveBeenCalled();
        });

        it('should fail validation on second attempt with same token', async () => {
            // Create a session
            const token = await service.createSession('test-provider', 'test-user-id');

            // Mock cache get for first validation
            vi.mocked(cacheManager.get).mockResolvedValueOnce({
                id: expect.any(String),
                providerId: 'test-provider',
                providerUserId: 'test-user-id',
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            });

            // First validation should succeed
            const firstResult = await service.validateSession(token);
            expect(firstResult.valid).toBe(true);

            // Mock cache get for second validation (session deleted)
            vi.mocked(cacheManager.get).mockResolvedValueOnce(null);

            // Second validation should fail (token already used)
            const secondResult = await service.validateSession(token);
            expect(secondResult.valid).toBe(false);
            expect(secondResult.username).toBeUndefined();
        });

        it('should handle invalid token format', async () => {
            const result = await service.validateSession('invalid-token');
            expect(result.valid).toBe(false);
            expect(result.username).toBeUndefined();
            expect(cacheManager.get).not.toHaveBeenCalled();
        });

        it('should handle non-existent session ID', async () => {
            // Create a fake token with valid format but non-existent session ID
            const fakeToken =
                'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im9pZGMtc2Vzc2lvbiJ9.eyJzdWIiOiJvaWRjLXNlc3Npb24iLCJpc3MiOiJ1bnJhaWQtYXBpIiwiYXVkIjoibG9jYWxob3N0IiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTksIm5vbmNlIjoicGFkZGluZy1mb3ItbGVuZ3RoIn0.OIDC-SESSION-00000000-0000-0000-0000-000000000000-xxxxxxxx';

            // Mock cache get to return null (session not found)
            vi.mocked(cacheManager.get).mockResolvedValueOnce(null);

            const result = await service.validateSession(fakeToken);
            expect(result.valid).toBe(false);
            expect(result.username).toBeUndefined();
        });

        it('should handle expired sessions', async () => {
            // Create a session
            const token = await service.createSession('test-provider', 'test-user-id');

            // Mock cache get to return an expired session
            vi.mocked(cacheManager.get).mockResolvedValueOnce({
                id: expect.any(String),
                providerId: 'test-provider',
                providerUserId: 'test-user-id',
                createdAt: new Date(Date.now() - 10 * 60 * 1000),
                expiresAt: new Date(Date.now() - 5 * 60 * 1000), // Expired 5 minutes ago
            });

            // Validation should fail due to expiration
            const result = await service.validateSession(token);
            expect(result.valid).toBe(false);
            expect(result.username).toBeUndefined();
            expect(cacheManager.del).toHaveBeenCalled();
        });
    });
});
