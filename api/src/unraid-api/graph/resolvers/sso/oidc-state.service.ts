import { Injectable, Logger } from '@nestjs/common';
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
    private readonly logger = new Logger(OidcStateService.name);
    private readonly stateCache = new Map<string, StateData>();
    private readonly hmacSecret: string;
    private readonly STATE_TTL_SECONDS = 600; // 10 minutes

    constructor() {
        // Always generate a new secret on API restart for security
        // This ensures state tokens cannot be reused across restarts
        this.hmacSecret = crypto.randomBytes(32).toString('hex');
        this.logger.debug('Generated new OIDC state secret for this session');

        // Clean up expired states periodically
        setInterval(() => this.cleanupExpiredStates(), 60000); // Every minute
    }

    generateSecureState(providerId: string, clientState: string, redirectUri?: string): string {
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
        this.stateCache.set(nonce, stateData);

        // Create signed state: nonce.timestamp.signature
        const dataToSign = `${nonce}.${timestamp}`;
        const signature = crypto.createHmac('sha256', this.hmacSecret).update(dataToSign).digest('hex');

        const signedState = `${dataToSign}.${signature}`;

        this.logger.debug(`Generated secure state for provider ${providerId} with nonce ${nonce}`);
        // Return state with provider ID prefix (unencrypted) for routing
        return `${providerId}:${signedState}`;
    }

    validateSecureState(
        state: string,
        expectedProviderId: string
    ): { isValid: boolean; clientState?: string; redirectUri?: string; error?: string } {
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
            if (age > this.STATE_TTL_SECONDS * 1000) {
                this.logger.warn(`State validation failed: token expired (age: ${age}ms)`);
                return {
                    isValid: false,
                    error: 'State token has expired',
                };
            }

            // Check if state exists in cache (prevents replay attacks)
            const cachedState = this.stateCache.get(nonce);
            if (!cachedState) {
                this.logger.warn(
                    `State validation failed: nonce ${nonce} not found in cache (possible replay attack)`
                );
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
            this.stateCache.delete(nonce);

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

    private cleanupExpiredStates(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [nonce, stateData] of this.stateCache.entries()) {
            const age = now - stateData.timestamp;
            if (age > this.STATE_TTL_SECONDS * 1000) {
                this.stateCache.delete(nonce);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            this.logger.debug(`Cleaned up ${cleaned} expired state entries`);
        }
    }
}
