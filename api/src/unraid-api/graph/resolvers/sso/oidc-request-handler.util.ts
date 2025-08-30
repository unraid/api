import { Logger } from '@nestjs/common';

import type { FastifyRequest } from '@app/unraid-api/types/fastify.js';
import { OidcAuthService } from '@app/unraid-api/graph/resolvers/sso/oidc-auth.service.js';
import { OidcStateExtractor } from '@app/unraid-api/graph/resolvers/sso/oidc-state-extractor.util.js';

export interface RequestInfo {
    protocol: string;
    host: string;
    fullUrl: string;
    baseUrl: string;
}

export interface OidcFlowResult {
    providerId: string;
    requestInfo: RequestInfo;
}

export interface OidcCallbackResult extends OidcFlowResult {
    paddedToken: string;
}

/**
 * Utility class to handle common OIDC request processing logic
 * between authorize and callback endpoints
 */
export class OidcRequestHandler {
    /**
     * Extract request information from Fastify request headers
     */
    static extractRequestInfo(req: FastifyRequest): RequestInfo {
        const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
        const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost:3000';
        const fullUrl = `${protocol}://${host}${req.url}`;
        const baseUrl = `${protocol}://${host}`;

        return {
            protocol,
            host,
            fullUrl,
            baseUrl,
        };
    }

    /**
     * Handle OIDC authorization flow
     */
    static async handleAuthorize(
        providerId: string,
        state: string,
        redirectUri: string,
        req: FastifyRequest,
        oidcAuthService: OidcAuthService,
        logger: Logger
    ): Promise<string> {
        const requestInfo = this.extractRequestInfo(req);

        logger.debug(`Authorization request - Provider: ${providerId}`);
        logger.debug(`Authorization request - Full URL: ${requestInfo.fullUrl}`);
        logger.debug(`Authorization request - Redirect URI: ${redirectUri}`);

        // Get authorization URL using the validated redirect URI and request headers
        const authUrl = await oidcAuthService.getAuthorizationUrl({
            providerId,
            state,
            requestOrigin: redirectUri,
            requestHeaders: req.headers as Record<string, string | string[] | undefined>,
        });

        logger.log(`Redirecting to OIDC provider: ${authUrl}`);
        return authUrl;
    }

    /**
     * Handle OIDC callback flow
     */
    static async handleCallback(
        code: string,
        state: string,
        req: FastifyRequest,
        oidcAuthService: OidcAuthService,
        logger: Logger
    ): Promise<OidcCallbackResult> {
        // Extract provider ID from state for routing
        const { providerId } = OidcStateExtractor.extractProviderFromState(
            state,
            oidcAuthService.getStateService()
        );

        const requestInfo = this.extractRequestInfo(req);

        logger.debug(`Callback request - Provider: ${providerId}`);
        logger.debug(`Callback request - Full URL: ${requestInfo.fullUrl}`);
        logger.debug(`Redirect URI will be retrieved from encrypted state`);

        // Handle the callback using stored redirect URI from state and request headers
        const paddedToken = await oidcAuthService.handleCallback({
            providerId,
            code,
            state,
            requestOrigin: requestInfo.baseUrl,
            fullCallbackUrl: requestInfo.fullUrl,
            requestHeaders: req.headers as Record<string, string | string[] | undefined>,
        });

        return {
            providerId,
            requestInfo,
            paddedToken,
        };
    }

    /**
     * Validate required parameters for authorization flow
     */
    static validateAuthorizeParams(
        providerId: string | undefined,
        state: string | undefined,
        redirectUri: string | undefined
    ): { providerId: string; state: string; redirectUri: string } {
        if (!providerId) {
            throw new Error('Provider ID is required');
        }
        if (!state) {
            throw new Error('State parameter is required');
        }
        if (!redirectUri) {
            throw new Error('Redirect URI is required');
        }

        return { providerId, state, redirectUri };
    }

    /**
     * Validate required parameters for callback flow
     */
    static validateCallbackParams(
        code: string | undefined,
        state: string | undefined
    ): { code: string; state: string } {
        if (!code || !state) {
            throw new Error('Missing required parameters');
        }

        return { code, state };
    }
}
