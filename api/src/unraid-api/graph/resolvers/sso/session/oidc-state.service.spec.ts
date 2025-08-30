import { CacheModule } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcStateService } from '@app/unraid-api/graph/resolvers/sso/session/oidc-state.service.js';

describe('OidcStateService', () => {
    let service: OidcStateService;
    let module: TestingModule;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        // Set a deterministic system time for consistent testing
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

        module = await Test.createTestingModule({
            imports: [CacheModule.register()],
            providers: [OidcStateService],
        }).compile();

        service = module.get<OidcStateService>(OidcStateService);
    });

    afterEach(async () => {
        vi.useRealTimers();
        // Close the testing module to prevent handle leaks
        if (module) {
            await module.close();
        }
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

        it('should store state data in cache and retrieve it', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            const state = await service.generateSecureState(providerId, clientState, redirectUri);
            const validation = await service.validateSecureState(state, providerId);

            expect(validation.isValid).toBe(true);
            expect(validation.clientState).toBe(clientState);
            expect(validation.redirectUri).toBe(redirectUri);
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
        it('should remove state from cache after successful validation', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = await service.generateSecureState(providerId, clientState);

            // First validation should succeed
            const result1 = await service.validateSecureState(state, providerId);
            expect(result1.isValid).toBe(true);

            // Second validation should fail (state was removed after first use)
            const result2 = await service.validateSecureState(state, providerId);
            expect(result2.isValid).toBe(false);
            expect(result2.error).toContain('not found or already used');
        });
    });
});
