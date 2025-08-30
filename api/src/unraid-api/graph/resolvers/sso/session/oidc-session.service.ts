import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { Cache } from 'cache-manager';

export interface OidcSession {
    id: string;
    providerId: string;
    providerUserId: string;
    createdAt: Date;
    expiresAt: Date;
}

@Injectable()
export class OidcSessionService {
    private readonly logger = new Logger(OidcSessionService.name);
    private readonly SESSION_TTL_MS = 2 * 60 * 1000; // 2 minutes in milliseconds (cache-manager v7 expects milliseconds)

    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

    async createSession(providerId: string, providerUserId: string): Promise<string> {
        const sessionId = randomUUID();
        const now = new Date();

        const session: OidcSession = {
            id: sessionId,
            providerId,
            providerUserId,
            createdAt: now,
            expiresAt: new Date(now.getTime() + this.SESSION_TTL_MS),
        };

        // Store in cache with TTL (in milliseconds for cache-manager v7)
        await this.cacheManager.set(sessionId, session, this.SESSION_TTL_MS);

        // Verify it was stored
        const verifyStored = await this.cacheManager.get(sessionId);
        if (verifyStored) {
            this.logger.debug(`Session successfully stored and verified with ID: ${sessionId}`);
        } else {
            this.logger.error(`CRITICAL: Session was NOT stored in cache for ID: ${sessionId}`);
        }

        this.logger.log(`Created OIDC session for provider ${providerId}`);

        return this.createPaddedToken(sessionId);
    }

    async validateSession(token: string): Promise<{ valid: boolean; username?: string }> {
        const sessionId = this.extractSessionId(token);
        if (!sessionId) {
            return { valid: false };
        }

        this.logger.debug(`Looking for session with ID: ${sessionId}`);
        const session = await this.cacheManager.get<OidcSession>(sessionId);
        if (!session) {
            this.logger.debug(`Session not found for ID: ${sessionId}`);
            return { valid: false };
        }

        const now = new Date();
        if (now > new Date(session.expiresAt)) {
            this.logger.debug(`Session expired`);
            await this.cacheManager.del(sessionId);
            return { valid: false };
        }

        // Delete the session immediately after successful validation
        // This ensures the token can only be validated once
        await this.cacheManager.del(sessionId);

        this.logger.log(
            `Validated and invalidated session for provider ${session.providerId} (one-time use)`
        );
        return { valid: true, username: 'root' };
    }

    private createPaddedToken(sessionId: string): string {
        // Create a fake JWT structure to exceed 500 characters
        // Format: header.payload.signature where signature contains our UUID
        const fakeHeader = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im9pZGMtc2Vzc2lvbiJ9';
        const fakePayload =
            'eyJzdWIiOiJvaWRjLXNlc3Npb24iLCJpc3MiOiJ1bnJhaWQtYXBpIiwiYXVkIjoibG9jYWxob3N0IiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTksIm5vbmNlIjoicGFkZGluZy1mb3ItbGVuZ3RoIn0';

        // Embed the session ID in the signature part with padding
        const signaturePart = `OIDC-SESSION-${sessionId}-` + 'x'.repeat(400);

        return `${fakeHeader}.${fakePayload}.${signaturePart}`;
    }

    private extractSessionId(token: string): string | null {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }

            const signature = parts[2];
            const match = signature.match(/^OIDC-SESSION-([a-f0-9-]+)-/);
            if (!match) {
                return null;
            }

            return match[1];
        } catch {
            return null;
        }
    }
}
