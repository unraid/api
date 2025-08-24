import { UnauthorizedException } from '@nestjs/common';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcStateExtractor } from '@app/unraid-api/graph/resolvers/sso/oidc-state-extractor.util.js';
import { OidcStateService } from '@app/unraid-api/graph/resolvers/sso/oidc-state.service.js';

describe('OidcStateExtractor', () => {
    let stateService: OidcStateService;

    beforeEach(() => {
        vi.clearAllMocks();
        stateService = new OidcStateService();
    });

    describe('extractProviderFromState', () => {
        it('should extract provider ID from valid state', () => {
            const state = 'provider123:nonce.timestamp.signature';
            const result = OidcStateExtractor.extractProviderFromState(state, stateService);

            expect(result.providerId).toBe('provider123');
            expect(result.originalState).toBe(state);
        });

        it('should handle state without provider prefix', () => {
            const state = 'invalid-state-format';
            const result = OidcStateExtractor.extractProviderFromState(state, stateService);

            expect(result.providerId).toBe('');
            expect(result.originalState).toBe(state);
        });
    });

    describe('extractAndValidateState', () => {
        it('should extract and validate a valid state with redirectUri', () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            // Generate a valid state
            const state = stateService.generateSecureState(providerId, clientState, redirectUri);

            // Extract and validate
            const result = OidcStateExtractor.extractAndValidateState(state, stateService);

            expect(result.providerId).toBe(providerId);
            expect(result.originalState).toBe(state);
            expect(result.clientState).toBe(clientState);
            expect(result.redirectUri).toBe(redirectUri);
        });

        it('should extract and validate a valid state without redirectUri', () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            // Generate a valid state without redirectUri
            const state = stateService.generateSecureState(providerId, clientState);

            // Extract and validate
            const result = OidcStateExtractor.extractAndValidateState(state, stateService);

            expect(result.providerId).toBe(providerId);
            expect(result.originalState).toBe(state);
            expect(result.clientState).toBe(clientState);
            expect(result.redirectUri).toBeUndefined();
        });

        it('should throw UnauthorizedException for invalid state format', () => {
            const invalidState = 'invalid-format';

            expect(() => {
                OidcStateExtractor.extractAndValidateState(invalidState, stateService);
            }).toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for expired state', () => {
            vi.useFakeTimers();

            const providerId = 'test-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            // Generate a valid state
            const state = stateService.generateSecureState(providerId, clientState, redirectUri);

            // Fast forward time beyond expiration (11 minutes)
            vi.advanceTimersByTime(11 * 60 * 1000);

            expect(() => {
                OidcStateExtractor.extractAndValidateState(state, stateService);
            }).toThrow(UnauthorizedException);

            vi.useRealTimers();
        });

        it('should throw UnauthorizedException for wrong provider ID', () => {
            const providerId = 'test-provider';
            const wrongProviderId = 'wrong-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            // Generate a valid state for one provider
            const state = stateService.generateSecureState(providerId, clientState, redirectUri);

            // Create a state string with wrong provider but otherwise valid signature
            const wrongProviderState = state.replace(`${providerId}:`, `${wrongProviderId}:`);

            expect(() => {
                OidcStateExtractor.extractAndValidateState(wrongProviderState, stateService);
            }).toThrow(UnauthorizedException);
        });
    });
});
