import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { decodeJwt } from 'jose';

export interface JwtClaims {
    sub?: string;
    email?: string;
    name?: string;
    hd?: string; // Google hosted domain
    [claim: string]: unknown;
}

@Injectable()
export class OidcClaimsService {
    private readonly logger = new Logger(OidcClaimsService.name);

    parseIdToken(idToken: string | undefined): JwtClaims | null {
        if (!idToken) {
            this.logger.error('No ID token received from provider');
            return null;
        }

        try {
            // Use jose to properly decode the JWT
            const claims = decodeJwt(idToken) as JwtClaims;

            // Log claims safely without PII - only structure, not values
            if (claims) {
                const claimKeys = Object.keys(claims).join(', ');
                this.logger.debug(`ID token decoded successfully. Available claims: [${claimKeys}]`);

                // Log claim types without exposing sensitive values
                for (const [key, value] of Object.entries(claims)) {
                    const valueType = Array.isArray(value) ? `array[${value.length}]` : typeof value;

                    // Only log structure, not actual values (avoid PII)
                    this.logger.debug(`Claim '${key}': type=${valueType}`);

                    // Check for unexpected claim types
                    if (valueType === 'object' && value !== null && !Array.isArray(value)) {
                        this.logger.warn(`Claim '${key}' contains complex object structure`);
                    }
                }
            }

            return claims;
        } catch (e) {
            this.logger.warn(`Failed to parse ID token: ${e}`);
            return null;
        }
    }

    validateClaims(claims: JwtClaims | null): string {
        if (!claims?.sub) {
            this.logger.error(
                'No subject in token - claims available: ' +
                    (claims ? Object.keys(claims).join(', ') : 'none')
            );
            throw new UnauthorizedException('No subject in token');
        }

        const userSub = claims.sub;
        this.logger.debug(`Processing authentication for user: ${userSub}`);
        return userSub;
    }

    extractUserInfo(claims: JwtClaims): {
        sub: string;
        email?: string;
        name?: string;
        domain?: string;
    } {
        return {
            sub: claims.sub!,
            email: claims.email,
            name: claims.name,
            domain: claims.hd,
        };
    }
}
