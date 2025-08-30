import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';
import { validateRedirectUri } from '@app/unraid-api/utils/redirect-uri-validator.js';

@Injectable()
export class OidcRedirectUriService {
    private readonly logger = new Logger(OidcRedirectUriService.name);
    private readonly CALLBACK_PATH = '/graphql/api/auth/oidc/callback';

    constructor(private readonly oidcConfig: OidcConfigPersistence) {}

    async getRedirectUri(
        requestOrigin: string,
        requestHeaders: Record<string, string | string[] | undefined>
    ): Promise<string> {
        // Extract protocol and host from headers for validation
        const { protocol, host } = this.getRequestOriginInfo(requestHeaders);

        // Get the global allowed origins from OIDC config
        const config = await this.oidcConfig.getConfig();
        const allowedOrigins = config?.defaultAllowedOrigins;

        // Debug logging to trace the issue
        this.logger.debug(
            `OIDC Config loaded: ${JSON.stringify(config ? { hasConfig: true, allowedOrigins } : { hasConfig: false })}`
        );
        this.logger.debug(
            `Validating redirect URI: ${requestOrigin} against host: ${protocol}://${host}`
        );
        this.logger.debug(`Allowed origins from config: ${JSON.stringify(allowedOrigins || [])}`);

        // Validate the provided requestOrigin using centralized validator
        // Pass the global allowed origins if available
        const validation = validateRedirectUri(
            requestOrigin,
            protocol,
            host,
            this.logger,
            allowedOrigins
        );

        if (!validation.isValid) {
            this.logger.warn(`Invalid redirect_uri in GraphQL OIDC flow: ${validation.reason}`);
            throw new UnauthorizedException(
                `Invalid redirect_uri: ${requestOrigin}. Please add this callback URI to Settings → Management Access → Allowed Redirect URIs`
            );
        }

        // Ensure the validated URI has the correct callback path
        try {
            const url = new URL(validation.validatedUri);
            // Only use origin to prevent path manipulation
            const redirectUri = `${url.origin}${this.CALLBACK_PATH}`;
            this.logger.debug(`Using validated redirect URI: ${redirectUri}`);
            return redirectUri;
        } catch (e) {
            this.logger.error(
                `Failed to construct redirect URI from validated URI: ${validation.validatedUri}`
            );
            throw new UnauthorizedException('Invalid redirect_uri');
        }
    }

    private getRequestOriginInfo(requestHeaders: Record<string, string | string[] | undefined>): {
        protocol: string;
        host: string | undefined;
    } {
        // Extract protocol from x-forwarded-proto or default to http
        const forwardedProto = requestHeaders['x-forwarded-proto'];
        const protocol = forwardedProto
            ? Array.isArray(forwardedProto)
                ? forwardedProto[0]
                : forwardedProto
            : 'http';

        // Extract host from x-forwarded-host or host header
        const forwardedHost = requestHeaders['x-forwarded-host'];
        const hostHeader = requestHeaders['host'];
        const host = forwardedHost
            ? Array.isArray(forwardedHost)
                ? forwardedHost[0]
                : forwardedHost
            : hostHeader
              ? Array.isArray(hostHeader)
                  ? hostHeader[0]
                  : hostHeader
              : undefined;

        return { protocol, host };
    }
}
