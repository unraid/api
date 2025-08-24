import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcStateService } from '@app/unraid-api/graph/resolvers/sso/oidc-state.service.js';

describe('OidcStateService', () => {
    let service: OidcStateService;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        // Create a single instance for all tests in a describe block
        service = new OidcStateService();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('generateSecureState', () => {
        it('should generate a state with provider prefix and signed token', () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            const state = service.generateSecureState(providerId, clientState, redirectUri);

            expect(state).toBeTruthy();
            expect(typeof state).toBe('string');
            expect(state.startsWith(`${providerId}:`)).toBe(true);

            // Extract signed portion and verify format (nonce.timestamp.signature)
            const signed = state.substring(providerId.length + 1);
            expect(signed.split('.').length).toBe(3);
        });

        it('should generate unique states for each call', () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            const state1 = service.generateSecureState(providerId, clientState, redirectUri);
            const state2 = service.generateSecureState(providerId, clientState, redirectUri);

            expect(state1).not.toBe(state2);
        });

        it('should work without redirectUri parameter (backwards compatibility)', () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = service.generateSecureState(providerId, clientState);

            expect(state).toBeTruthy();
            expect(typeof state).toBe('string');
            expect(state.startsWith(`${providerId}:`)).toBe(true);
        });
    });

    describe('validateSecureState', () => {
        it('should validate a valid state token', () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = service.generateSecureState(providerId, clientState);
            const result = service.validateSecureState(state, providerId);

            expect(result.isValid).toBe(true);
            expect(result.clientState).toBe(clientState);
            expect(result.redirectUri).toBeUndefined();
            expect(result.error).toBeUndefined();
        });

        it('should validate a state token with redirectUri', () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            const state = service.generateSecureState(providerId, clientState, redirectUri);
            const result = service.validateSecureState(state, providerId);

            expect(result.isValid).toBe(true);
            expect(result.clientState).toBe(clientState);
            expect(result.redirectUri).toBe(redirectUri);
            expect(result.error).toBeUndefined();
        });

        it('should reject state with wrong provider ID', () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = service.generateSecureState(providerId, clientState);
            const result = service.validateSecureState(state, 'wrong-provider');

            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Provider ID mismatch in state');
        });

        it('should reject expired state tokens', () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = service.generateSecureState(providerId, clientState);

            // Fast forward time beyond expiration (11 minutes)
            vi.advanceTimersByTime(11 * 60 * 1000);

            const result = service.validateSecureState(state, providerId);

            expect(result.isValid).toBe(false);
            expect(result.error).toBe('State token has expired');
        });

        it('should reject reused state tokens', () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = service.generateSecureState(providerId, clientState);

            // First validation should succeed
            const result1 = service.validateSecureState(state, providerId);
            expect(result1.isValid).toBe(true);

            // Second validation should fail (replay attack prevention)
            const result2 = service.validateSecureState(state, providerId);
            expect(result2.isValid).toBe(false);
            expect(result2.error).toBe('State token not found or already used');
        });

        it('should reject invalid state tokens', () => {
            const result = service.validateSecureState('invalid.state.token', 'test-provider');

            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Invalid state format');
        });

        it('should reject tampered state tokens', () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            const state = service.generateSecureState(providerId, clientState);

            // Tamper with the signature
            const parts = state.split('.');
            parts[2] = parts[2].slice(0, -4) + 'XXXX';
            const tamperedState = parts.join('.');

            const result = service.validateSecureState(tamperedState, providerId);

            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Invalid state signature');
        });
    });

    describe('extractProviderFromState', () => {
        it('should extract provider from state prefix', () => {
            const state = 'provider-id:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';
            const result = service.extractProviderFromState(state);

            expect(result).toBe('provider-id');
        });

        it('should handle states with multiple colons', () => {
            const state = 'provider-id:jwt:with:colons';
            const result = service.extractProviderFromState(state);

            expect(result).toBe('provider-id');
        });

        it('should return null for invalid format', () => {
            const result = service.extractProviderFromState('invalid-state');

            expect(result).toBeNull();
        });
    });

    describe('extractProviderFromLegacyState', () => {
        it('should extract provider from legacy colon-separated format', () => {
            const result = service.extractProviderFromLegacyState('provider-id:client-state');

            expect(result.providerId).toBe('provider-id');
            expect(result.originalState).toBe('client-state');
        });

        it('should handle multiple colons in legacy format', () => {
            const result = service.extractProviderFromLegacyState(
                'provider-id:client:state:with:colons'
            );

            expect(result.providerId).toBe('provider-id');
            expect(result.originalState).toBe('client:state:with:colons');
        });

        it('should return empty provider for JWT format', () => {
            const jwtState = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';
            const result = service.extractProviderFromLegacyState(jwtState);

            expect(result.providerId).toBe('');
            expect(result.originalState).toBe(jwtState);
        });

        it('should return empty provider for unknown format', () => {
            const result = service.extractProviderFromLegacyState('some-random-state');

            expect(result.providerId).toBe('');
            expect(result.originalState).toBe('some-random-state');
        });
    });

    describe('cleanupExpiredStates', () => {
        it('should clean up expired states periodically', () => {
            const providerId = 'test-provider';

            // Generate multiple states
            service.generateSecureState(providerId, 'state1');
            service.generateSecureState(providerId, 'state2');
            service.generateSecureState(providerId, 'state3');

            // Fast forward past expiration
            vi.advanceTimersByTime(11 * 60 * 1000);

            // Generate a new state that shouldn't be cleaned
            const validState = service.generateSecureState(providerId, 'state4');

            // Trigger cleanup (happens every minute)
            vi.advanceTimersByTime(60 * 1000);

            // The new state should still be valid
            const result = service.validateSecureState(validState, providerId);
            expect(result.isValid).toBe(true);
        });
    });
});
