import { CacheModule } from '@nestjs/cache-manager';
import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcStateExtractor } from '@app/unraid-api/graph/resolvers/sso/session/oidc-state-extractor.util.js';
import { OidcStateService } from '@app/unraid-api/graph/resolvers/sso/session/oidc-state.service.js';

describe('OidcStateExtractor', () => {
    let stateService: OidcStateService;

    beforeEach(async () => {
        vi.clearAllMocks();

        const module = await Test.createTestingModule({
            imports: [CacheModule.register()],
            providers: [OidcStateService],
        }).compile();

        stateService = module.get<OidcStateService>(OidcStateService);
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
        it('should extract and validate a valid state with redirectUri', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            // Generate a valid state
            const state = await stateService.generateSecureState(providerId, clientState, redirectUri);

            // Extract and validate
            const result = await OidcStateExtractor.extractAndValidateState(state, stateService);

            expect(result.providerId).toBe(providerId);
            expect(result.originalState).toBe(state);
            expect(result.clientState).toBe(clientState);
            expect(result.redirectUri).toBe(redirectUri);
        });

        it('should extract and validate a valid state without redirectUri', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';

            // Generate a valid state without redirectUri
            const state = await stateService.generateSecureState(providerId, clientState);

            // Extract and validate
            const result = await OidcStateExtractor.extractAndValidateState(state, stateService);

            expect(result.providerId).toBe(providerId);
            expect(result.originalState).toBe(state);
            expect(result.clientState).toBe(clientState);
            expect(result.redirectUri).toBeUndefined();
        });

        it('should throw UnauthorizedException for invalid state format', async () => {
            const invalidState = 'invalid-format';

            await expect(async () => {
                await OidcStateExtractor.extractAndValidateState(invalidState, stateService);
            }).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for expired state', async () => {
            vi.useFakeTimers();

            const providerId = 'test-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            // Generate a valid state
            const state = await stateService.generateSecureState(providerId, clientState, redirectUri);

            // Fast forward time beyond expiration (11 minutes)
            vi.advanceTimersByTime(11 * 60 * 1000);

            await expect(async () => {
                await OidcStateExtractor.extractAndValidateState(state, stateService);
            }).rejects.toThrow(UnauthorizedException);

            vi.useRealTimers();
        });

        it('should throw UnauthorizedException for wrong provider ID', async () => {
            const providerId = 'test-provider';
            const wrongProviderId = 'wrong-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            // Generate a valid state
            const state = await stateService.generateSecureState(providerId, clientState, redirectUri);

            // Create a fake state with wrong provider prefix
            const tamperedState = state.replace(providerId, wrongProviderId);

            await expect(async () => {
                await OidcStateExtractor.extractAndValidateState(tamperedState, stateService);
            }).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for tampered state', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            // Generate a valid state
            const state = await stateService.generateSecureState(providerId, clientState, redirectUri);

            // Tamper with the signature
            const tamperedState = state.slice(0, -5) + 'xxxxx';

            await expect(async () => {
                await OidcStateExtractor.extractAndValidateState(tamperedState, stateService);
            }).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for reused state (replay attack)', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-state-123';
            const redirectUri = 'https://example.com/callback';

            // Generate a valid state
            const state = await stateService.generateSecureState(providerId, clientState, redirectUri);

            // First validation should succeed
            const result1 = await OidcStateExtractor.extractAndValidateState(state, stateService);
            expect(result1.providerId).toBe(providerId);

            // Second validation should fail (replay attack)
            await expect(async () => {
                await OidcStateExtractor.extractAndValidateState(state, stateService);
            }).rejects.toThrow(UnauthorizedException);
        });
    });
});
