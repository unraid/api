import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import crypto from 'crypto';

interface StateData {
    nonce: string;
    clientState: string;
    timestamp: number;
    providerId: string;
    redirectUri?: string;
}

@Injectable()
export class OidcStateService {
    private static instanceCount = 0;
    private readonly instanceId: number;
    private readonly logger = new Logger(OidcStateService.name);
    private readonly hmacSecret: string;
    private readonly STATE_TTL_MS = 600000; // 10 minutes in milliseconds (cache-manager v7+ expects milliseconds, not seconds)
    private readonly STATE_CACHE_PREFIX = 'oidc_state:';

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
        // Track instance creation
        this.instanceId = ++OidcStateService.instanceCount;

        // Always generate a new secret on API restart for security
        // This ensures state tokens cannot be reused across restarts
        this.hmacSecret = crypto.randomBytes(32).toString('hex');
        this.logger.warn(`OidcStateService instance #${this.instanceId} created with new HMAC secret`);
        this.logger.debug(`HMAC secret first 8 chars: ${this.hmacSecret.substring(0, 8)}`);
    }

    async generateSecureState(
        providerId: string,
        clientState: string,
        redirectUri?: string
    ): Promise<string> {
        const nonce = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();

        // Store state data in cache
        const stateData: StateData = {
            nonce,
            clientState,
            timestamp,
            providerId,
            redirectUri,
        };

        // Store in cache with TTL (in milliseconds for cache-manager v7)
        const cacheKey = `${this.STATE_CACHE_PREFIX}${nonce}`;
        this.logger.debug(`Storing state with key: ${cacheKey}, TTL: ${this.STATE_TTL_MS}ms`);
        await this.cacheManager.set(cacheKey, stateData, this.STATE_TTL_MS);

        // Verify it was stored
        const verifyStored = await this.cacheManager.get(cacheKey);
        if (verifyStored) {
            this.logger.debug(`State successfully stored and verified for key: ${cacheKey}`);
        } else {
            this.logger.error(`CRITICAL: State was NOT stored in cache for key: ${cacheKey}`);
        }

        // Create signed state: nonce.timestamp.signature
        const dataToSign = `${nonce}.${timestamp}`;
        const signature = crypto.createHmac('sha256', this.hmacSecret).update(dataToSign).digest('hex');

        const signedState = `${dataToSign}.${signature}`;

        this.logger.debug(`Generated secure state for provider ${providerId} with nonce ${nonce}`);
        this.logger.debug(
            `Instance #${this.instanceId}, HMAC secret first 8 chars: ${this.hmacSecret.substring(0, 8)}`
        );
        this.logger.debug(`Stored redirectUri: ${redirectUri}`);
        // Return state with provider ID prefix (unencrypted) for routing
        return `${providerId}:${signedState}`;
    }

    async validateSecureState(
        state: string,
        expectedProviderId: string
    ): Promise<{ isValid: boolean; clientState?: string; redirectUri?: string; error?: string }> {
        try {
            // Extract provider ID and signed state
            const parts = state.split(':');
            if (parts.length < 2) {
                return {
                    isValid: false,
                    error: 'Invalid state format',
                };
            }

            const providerId = parts[0];
            const signedState = parts.slice(1).join(':');

            // Validate provider ID matches
            if (providerId !== expectedProviderId) {
                this.logger.warn(
                    `State validation failed: provider mismatch. Expected ${expectedProviderId}, got ${providerId}`
                );
                return {
                    isValid: false,
                    error: 'Provider ID mismatch in state',
                };
            }

            // Parse and verify signature
            const stateParts = signedState.split('.');
            if (stateParts.length !== 3) {
                return {
                    isValid: false,
                    error: 'Invalid state format',
                };
            }

            const [nonce, timestampStr, signature] = stateParts;
            const timestamp = parseInt(timestampStr, 10);

            // Verify signature
            const dataToSign = `${nonce}.${timestampStr}`;
            const expectedSignature = crypto
                .createHmac('sha256', this.hmacSecret)
                .update(dataToSign)
                .digest('hex');

            if (signature !== expectedSignature) {
                this.logger.warn(`State validation failed: invalid signature`);
                return {
                    isValid: false,
                    error: 'Invalid state signature',
                };
            }

            // Check timestamp expiration
            const now = Date.now();
            const age = now - timestamp;
            if (age > this.STATE_TTL_MS) {
                this.logger.warn(`State validation failed: token expired (age: ${age}ms)`);
                return {
                    isValid: false,
                    error: 'State token has expired',
                };
            }

            // Check if state exists in cache (prevents replay attacks)
            const cacheKey = `${this.STATE_CACHE_PREFIX}${nonce}`;
            this.logger.debug(`Looking for nonce ${nonce} in cache with key: ${cacheKey}`);
            this.logger.debug(
                `Instance #${this.instanceId}, HMAC secret first 8 chars: ${this.hmacSecret.substring(0, 8)}`
            );
            this.logger.debug(`Cache manager type: ${this.cacheManager.constructor.name}`);

            const cachedState = await this.cacheManager.get<StateData>(cacheKey);

            if (!cachedState) {
                this.logger.warn(
                    `State validation failed: nonce ${nonce} not found in cache (possible replay attack)`
                );
                this.logger.warn(`Cache key checked: ${cacheKey}`);

                return {
                    isValid: false,
                    error: 'State token not found or already used',
                };
            }

            // Verify the cached provider ID matches
            if (cachedState.providerId !== expectedProviderId) {
                this.logger.warn(`State validation failed: cached provider mismatch`);
                return {
                    isValid: false,
                    error: 'Invalid state token',
                };
            }

            // Remove from cache to prevent reuse
            await this.cacheManager.del(cacheKey);

            this.logger.debug(`State validation successful for provider ${expectedProviderId}`);
            return {
                isValid: true,
                clientState: cachedState.clientState,
                redirectUri: cachedState.redirectUri,
            };
        } catch (error) {
            this.logger.error(
                `State validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            return {
                isValid: false,
                error: 'Invalid state token',
            };
        }
    }

    extractProviderFromLegacyState(state: string): { providerId: string; originalState: string } {
        // Backward compatibility: handle old format states
        const parts = state.split(':');
        if (parts.length >= 2 && !state.includes('.')) {
            // Old format: providerId:clientState
            return {
                providerId: parts[0],
                originalState: parts.slice(1).join(':'),
            };
        }

        // New format (JWT) or unknown format
        return {
            providerId: '',
            originalState: state,
        };
    }

    extractProviderFromState(state: string): string | null {
        // Extract provider ID from state prefix (no decryption needed)
        const parts = state.split(':');
        if (parts.length >= 2) {
            return parts[0];
        }
        return null;
    }

    // Cleanup is now handled by cache TTL
}
