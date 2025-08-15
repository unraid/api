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
    private readonly SESSION_TTL_SECONDS = 2 * 60; // 2 minutes for one-time token security

    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

    async createSession(providerId: string, providerUserId: string): Promise<string> {
        const sessionId = randomUUID();
        const now = new Date();

        const session: OidcSession = {
            id: sessionId,
            providerId,
            providerUserId,
            createdAt: now,
            expiresAt: new Date(now.getTime() + this.SESSION_TTL_SECONDS * 1000),
        };

        // Store in cache with TTL
        await this.cacheManager.set(sessionId, session, this.SESSION_TTL_SECONDS * 1000);
        this.logger.log(`Created OIDC session ${sessionId} for provider ${providerId}`);

        return this.createPaddedToken(sessionId);
    }

    async validateSession(token: string): Promise<{ valid: boolean; username?: string }> {
        const sessionId = this.extractSessionId(token);
        if (!sessionId) {
            return { valid: false };
        }

        const session = await this.cacheManager.get<OidcSession>(sessionId);
        if (!session) {
            this.logger.debug(`Session ${sessionId} not found`);
            return { valid: false };
        }

        const now = new Date();
        if (now > new Date(session.expiresAt)) {
            this.logger.debug(`Session ${sessionId} expired`);
            await this.cacheManager.del(sessionId);
            return { valid: false };
        }

        // Delete the session immediately after successful validation
        // This ensures the token can only be validated once
        await this.cacheManager.del(sessionId);

        this.logger.log(
            `Validated and invalidated session ${sessionId} for provider ${session.providerId} (one-time use)`
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
