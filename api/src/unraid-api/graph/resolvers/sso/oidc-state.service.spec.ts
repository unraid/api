import { Cache } from '@nestjs/cache-manager';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcStateService } from '@app/unraid-api/graph/resolvers/sso/oidc-state.service.js';

describe('OidcStateService', () => {
    let service: OidcStateService;
    let mockCacheManager: Cache;
    let cacheData: Map<string, any>;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Create a mock cache manager with in-memory storage
        cacheData = new Map<string, any>();
        mockCacheManager = {
            get: vi.fn(async (key: string) => cacheData.get(key)),
            set: vi.fn(async (key: string, value: any, ttl?: number) => {
                cacheData.set(key, value);
                // Simulate TTL by scheduling deletion
                if (ttl) {
                    setTimeout(() => cacheData.delete(key), ttl);
                }
            }),
            del: vi.fn(async (key: string) => {
                cacheData.delete(key);
            }),
            reset: vi.fn(async () => {
                cacheData.clear();
            }),
        } as any;

        // Create a single instance for all tests in a describe block
        service = new OidcStateService(mockCacheManager);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('generateSecureState', () => {
        it('should generate a state with provider prefix and signed token', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            const state = await service.generateSecureState(providerId, clientState, redirectUri);

            expect(state).toBeTruthy();
            expect(typeof state).toBe('string');
            expect(state.startsWith(`${providerId}:`)).toBe(true);

            // Extract signed portion and verify format (nonce.timestamp.signature)
            const signed = state.substring(providerId.length + 1);
            expect(signed.split('.').length).toBe(3);
        });

        it('should generate unique states for each call', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            const state1 = await service.generateSecureState(providerId, clientState, redirectUri);
            const state2 = await service.generateSecureState(providerId, clientState, redirectUri);

            expect(state1).not.toBe(state2);
        });

        it('should work without redirectUri parameter (backwards compatibility)', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = await service.generateSecureState(providerId, clientState);

            expect(state).toBeTruthy();
            expect(state.startsWith(`${providerId}:`)).toBe(true);
        });

        it('should store state data in cache', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            await service.generateSecureState(providerId, clientState, redirectUri);

            expect(mockCacheManager.set).toHaveBeenCalledWith(
                expect.stringContaining('oidc_state:'),
                expect.objectContaining({
                    clientState,
                    providerId,
                    redirectUri,
                }),
                600000 // 10 minutes TTL
            );
        });
    });

    describe('validateSecureState', () => {
        it('should validate a valid state token', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = await service.generateSecureState(providerId, clientState);
            const result = await service.validateSecureState(state, providerId);

            expect(result.isValid).toBe(true);
            expect(result.clientState).toBe(clientState);
            expect(result.error).toBeUndefined();
        });

        it('should validate a state token with redirectUri', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            const state = await service.generateSecureState(providerId, clientState, redirectUri);
            const result = await service.validateSecureState(state, providerId);

            expect(result.isValid).toBe(true);
            expect(result.clientState).toBe(clientState);
            expect(result.redirectUri).toBe(redirectUri);
            expect(result.error).toBeUndefined();
        });

        it('should reject state with wrong provider ID', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = await service.generateSecureState(providerId, clientState);
            const result = await service.validateSecureState(state, 'different-provider');

            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Provider ID mismatch');
        });

        it('should reject expired state tokens', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = await service.generateSecureState(providerId, clientState);

            // Advance time by 11 minutes (past the 10-minute TTL)
            vi.advanceTimersByTime(11 * 60 * 1000);

            const result = await service.validateSecureState(state, providerId);

            expect(result.isValid).toBe(false);
            expect(result.error).toContain('expired');
        });

        it('should reject reused state tokens', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = await service.generateSecureState(providerId, clientState);

            // First validation should succeed
            const result1 = await service.validateSecureState(state, providerId);
            expect(result1.isValid).toBe(true);

            // Second validation should fail (replay attack prevention)
            const result2 = await service.validateSecureState(state, providerId);
            expect(result2.isValid).toBe(false);
            expect(result2.error).toContain('not found or already used');
        });

        it('should reject invalid state tokens', async () => {
            const providerId = 'test-provider';
            const invalidState = `${providerId}:invalid-format`;

            const result = await service.validateSecureState(invalidState, providerId);

            expect(result.isValid).toBe(false);
            expect(result.error).toBeTruthy();
        });

        it('should reject tampered state tokens', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = await service.generateSecureState(providerId, clientState);
            // Tamper with the signature
            const tamperedState = state.substring(0, state.length - 5) + 'xxxxx';

            const result = await service.validateSecureState(tamperedState, providerId);

            expect(result.isValid).toBe(false);
            expect(result.error).toContain('signature');
        });
    });

    describe('extractProviderFromState', () => {
        it('should extract provider ID from state', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = await service.generateSecureState(providerId, clientState);
            const extracted = service.extractProviderFromState(state);

            expect(extracted).toBe(providerId);
        });

        it('should return null for invalid state format', () => {
            const invalidState = 'invalid-state-without-colon';
            const extracted = service.extractProviderFromState(invalidState);

            expect(extracted).toBeNull();
        });
    });

    describe('extractProviderFromLegacyState', () => {
        it('should handle legacy state format', () => {
            const legacyState = 'provider-id:client-state-value';
            const result = service.extractProviderFromLegacyState(legacyState);

            expect(result.providerId).toBe('provider-id');
            expect(result.originalState).toBe('client-state-value');
        });

        it('should handle new signed state format', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = await service.generateSecureState(providerId, clientState);
            const result = service.extractProviderFromLegacyState(state);

            // New format should not be recognized as legacy
            expect(result.providerId).toBe('');
            expect(result.originalState).toBe(state);
        });
    });

    describe('cache TTL', () => {
        it('should set proper TTL on cache entries', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            await service.generateSecureState(providerId, clientState);

            // Verify cache set was called with proper TTL
            expect(mockCacheManager.set).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                600000 // 10 minutes in milliseconds
            );
        });

        it('should remove state from cache after successful validation', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = await service.generateSecureState(providerId, clientState);
            await service.validateSecureState(state, providerId);

            // Verify cache del was called
            expect(mockCacheManager.del).toHaveBeenCalled();
        });
    });
});
