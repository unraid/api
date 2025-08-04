import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

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
    private readonly sessions = new Map<string, OidcSession>();
    private readonly SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes

    createSession(providerId: string, providerUserId: string): string {
        const sessionId = randomUUID();
        const now = new Date();

        const session: OidcSession = {
            id: sessionId,
            providerId,
            providerUserId,
            createdAt: now,
            expiresAt: new Date(now.getTime() + this.SESSION_TTL_MS),
        };

        this.sessions.set(sessionId, session);
        this.logger.log(`Created OIDC session ${sessionId} for provider ${providerId}`);

        // Schedule cleanup
        setTimeout(() => {
            this.sessions.delete(sessionId);
            this.logger.debug(`Cleaned up expired session ${sessionId}`);
        }, this.SESSION_TTL_MS);

        return this.createPaddedToken(sessionId);
    }

    validateSession(token: string): { valid: boolean; username?: string } {
        const sessionId = this.extractSessionId(token);
        if (!sessionId) {
            return { valid: false };
        }

        const session = this.sessions.get(sessionId);
        if (!session) {
            this.logger.debug(`Session ${sessionId} not found`);
            return { valid: false };
        }

        const now = new Date();
        if (now > session.expiresAt) {
            this.logger.debug(`Session ${sessionId} expired`);
            this.sessions.delete(sessionId);
            return { valid: false };
        }

        this.logger.log(`Validated session ${sessionId} for provider ${session.providerId}`);
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
