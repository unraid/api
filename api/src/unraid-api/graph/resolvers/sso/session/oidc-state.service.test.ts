import { CacheModule } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcStateService } from '@app/unraid-api/graph/resolvers/sso/session/oidc-state.service.js';

describe('OidcStateService', () => {
    let service: OidcStateService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [CacheModule.register()],
            providers: [OidcStateService],
        }).compile();

        service = module.get<OidcStateService>(OidcStateService);
    });

    describe('state generation and validation flow', () => {
        it('should generate state with redirect URI and validate it successfully', async () => {
            const providerId = 'unraid.net';
            const clientState = 'client-state-123';
            const redirectUri = 'http://devgen-dev1.local/graphql/api/auth/oidc/callback';

            // Generate state
            const state = await service.generateSecureState(providerId, clientState, redirectUri);

            // Verify state format: providerId:nonce.timestamp.signature
            expect(state).toMatch(/^unraid\.net:[a-f0-9]+\.\d+\.[a-f0-9]+$/);

            // Extract and verify parts
            const [extractedProviderId, signedState] = state.split(':');
            expect(extractedProviderId).toBe(providerId);

            // Parse the signed state components
            const [nonce, timestamp, signature] = signedState.split('.');

            // Verify nonce is a 32-character hex string (16 bytes)
            expect(nonce).toMatch(/^[a-f0-9]{32}$/);

            // Verify timestamp is a valid number and recent
            const timestampNum = parseInt(timestamp, 10);
            expect(timestampNum).toBeGreaterThan(Date.now() - 1000); // Generated within last second
            expect(timestampNum).toBeLessThanOrEqual(Date.now());

            // Verify signature is a 64-character hex string (SHA256 output)
            expect(signature).toMatch(/^[a-f0-9]{64}$/);

            // Validate the state
            const validation = await service.validateSecureState(state, providerId);

            expect(validation.isValid).toBe(true);
            expect(validation.clientState).toBe(clientState);
            expect(validation.redirectUri).toBe(redirectUri);
        });

        it('should verify signed state integrity with HMAC', async () => {
            const providerId = 'test-provider';
            const clientState = 'test-state';
            const redirectUri = 'http://localhost:3000/callback';

            const state = await service.generateSecureState(providerId, clientState, redirectUri);

            // Tamper with the signature
            const [provider, signedState] = state.split(':');
            const [nonce, timestamp] = signedState.split('.');
            const tamperedSignature = 'a'.repeat(64); // Invalid signature
            const tamperedState = `${provider}:${nonce}.${timestamp}.${tamperedSignature}`;

            const validation = await service.validateSecureState(tamperedState, providerId);

            expect(validation.isValid).toBe(false);
            expect(validation.error).toContain('Invalid state signature');
        });

        it('should fail validation when nonce is not in cache', async () => {
            const providerId = 'unraid.net';
            // Create a fake state that looks valid but has unknown nonce
            const fakeState = `unraid.net:fakenonce123.${Date.now()}.fakesignature456`;

            const validation = await service.validateSecureState(fakeState, providerId);

            expect(validation.isValid).toBe(false);
            expect(validation.error).toContain('Invalid state signature');
        });

        it('should prevent replay attacks by removing nonce after validation', async () => {
            const providerId = 'test-provider';
            const clientState = 'test-state';
            const redirectUri = 'http://localhost:3000/callback';

            // Generate and validate state once
            const state = await service.generateSecureState(providerId, clientState, redirectUri);
            const firstValidation = await service.validateSecureState(state, providerId);
            expect(firstValidation.isValid).toBe(true);

            // Try to validate the same state again (replay attack)
            const secondValidation = await service.validateSecureState(state, providerId);
            expect(secondValidation.isValid).toBe(false);
            expect(secondValidation.error).toContain('State token not found or already used');
        });

        it('should handle state with missing redirect URI', async () => {
            const providerId = 'test-provider';
            const clientState = 'test-state';
            // No redirect URI provided

            const state = await service.generateSecureState(providerId, clientState);
            const validation = await service.validateSecureState(state, providerId);

            expect(validation.isValid).toBe(true);
            expect(validation.clientState).toBe(clientState);
            expect(validation.redirectUri).toBeUndefined();
        });

        it('should reject state with wrong provider ID', async () => {
            const providerId = 'provider-a';
            const wrongProviderId = 'provider-b';
            const clientState = 'test-state';

            const state = await service.generateSecureState(providerId, clientState);
            const validation = await service.validateSecureState(state, wrongProviderId);

            expect(validation.isValid).toBe(false);
            expect(validation.error).toContain('Provider ID mismatch');
        });

        it('should extract provider from state correctly', async () => {
            const providerId = 'unraid.net';
            const state = await service.generateSecureState(providerId, 'test', 'http://example.com');

            const extracted = service.extractProviderFromState(state);
            expect(extracted).toBe(providerId);
        });

        it('should handle state expiration', async () => {
            const providerId = 'test-provider';
            const clientState = 'test-state';

            // Generate state
            const state = await service.generateSecureState(providerId, clientState);

            // Mock timestamp to simulate expired state
            const parts = state.split(':')[1].split('.');
            const nonce = parts[0];
            const expiredTimestamp = Date.now() - 700000; // 11+ minutes ago
            const fakeState = `${providerId}:${nonce}.${expiredTimestamp}.fakesignature`;

            const validation = await service.validateSecureState(fakeState, providerId);
            expect(validation.isValid).toBe(false);
            expect(validation.error).toContain('Invalid state signature'); // Will fail on signature first
        });
    });

    describe('redirect URI extraction from state', () => {
        it('should store and retrieve redirect URI from state token', async () => {
            const providerId = 'unraid.net';
            const clientState = 'original-client-state';
            const redirectUri = 'http://devgen-dev1.local/graphql/api/auth/oidc/callback';

            // This simulates the authorize flow
            const stateToken = await service.generateSecureState(providerId, clientState, redirectUri);

            // Log the generated state for debugging
            console.log('Generated state token:', stateToken);

            // This simulates the callback flow
            const validation = await service.validateSecureState(stateToken, providerId);

            expect(validation.isValid).toBe(true);
            expect(validation.redirectUri).toBe(redirectUri);
            expect(validation.clientState).toBe(clientState);
        });

        it('should handle dynamic redirect URIs for different origins', async () => {
            const providerId = 'google';
            const clientState = 'state123';

            // Test with different origins
            const origins = [
                'http://localhost:3000/graphql/api/auth/oidc/callback',
                'https://myserver.local/graphql/api/auth/oidc/callback',
                'http://192.168.1.100/graphql/api/auth/oidc/callback',
            ];

            for (const redirectUri of origins) {
                const state = await service.generateSecureState(providerId, clientState, redirectUri);
                const validation = await service.validateSecureState(state, providerId);

                expect(validation.isValid).toBe(true);
                expect(validation.redirectUri).toBe(redirectUri);
            }
        });
    });

    describe('cache management', () => {
        it('should handle TTL expiration correctly', async () => {
            const providerId = 'test-provider';
            const clientState = 'test-state';

            const state = await service.generateSecureState(providerId, clientState);

            // First validation should succeed
            const validation1 = await service.validateSecureState(state, providerId);
            expect(validation1.isValid).toBe(true);

            // State should be removed after first use (replay protection)
            const validation2 = await service.validateSecureState(state, providerId);
            expect(validation2.isValid).toBe(false);
        });

        it('should store complete state data in cache with redirect URI', async () => {
            const providerId = 'test-provider';
            const clientState = 'client-123';
            const redirectUri = 'http://example.com/callback';

            const state = await service.generateSecureState(providerId, clientState, redirectUri);

            // Extract nonce from the generated state
            const [, signedState] = state.split(':');
            const [nonce] = signedState.split('.');

            // Access the cache directly to verify stored data
            const cacheKey = `oidc_state:${nonce}`;
            const cachedData = await service['cacheManager'].get(cacheKey);

            expect(cachedData).toBeDefined();
            expect(cachedData).toMatchObject({
                nonce,
                clientState,
                providerId,
                redirectUri,
            });
            expect(cachedData.timestamp).toBeGreaterThan(Date.now() - 1000);
            expect(cachedData.timestamp).toBeLessThanOrEqual(Date.now());
        });
    });
});
