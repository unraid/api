import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as client from 'openid-client';

import { OidcProvider } from '@app/unraid-api/graph/resolvers/sso/models/oidc-provider.model.js';
import { OidcErrorHelper } from '@app/unraid-api/graph/resolvers/sso/utils/oidc-error.helper.js';

@Injectable()
export class OidcValidationService {
    private readonly logger = new Logger(OidcValidationService.name);

    constructor(private readonly configService: ConfigService) {}

    /**
     * Validate OIDC provider configuration by attempting discovery
     * Returns validation result with helpful error messages for debugging
     */
    async validateProvider(
        provider: OidcProvider
    ): Promise<{ isValid: boolean; error?: string; details?: unknown }> {
        try {
            // Validate issuer URL is present
            if (!provider.issuer) {
                return {
                    isValid: false,
                    error: 'No issuer URL provided. Please specify the OIDC provider issuer URL.',
                    details: { type: 'MISSING_ISSUER' },
                };
            }

            // Validate issuer URL is valid
            let serverUrl: URL;
            try {
                serverUrl = new URL(provider.issuer);
            } catch (urlError) {
                return {
                    isValid: false,
                    error: `Invalid issuer URL format: '${provider.issuer}'. Please provide a valid URL.`,
                    details: {
                        type: 'INVALID_URL',
                        originalError: urlError instanceof Error ? urlError.message : String(urlError),
                    },
                };
            }

            // Configure client options for HTTP if needed
            let clientOptions: any = undefined;
            if (serverUrl.protocol === 'http:') {
                this.logger.warn(
                    `HTTP issuer URL detected for provider ${provider.id}: ${provider.issuer} - This is insecure`
                );
                clientOptions = {
                    execute: [client.allowInsecureRequests],
                };
            }

            // Attempt OIDC discovery
            await this.performDiscovery(provider, clientOptions);
            return { isValid: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Log the raw error for debugging
            this.logger.log(`Raw discovery error for ${provider.id}: ${errorMessage}`);

            // Use the helper to parse the error
            const { userFriendlyError, details } = OidcErrorHelper.parseDiscoveryError(
                error,
                provider.issuer
            );

            this.logger.error(`Validation failed for provider ${provider.id}: ${errorMessage}`);

            // Add debug logging for HTTP status errors
            if (errorMessage.includes('unexpected HTTP response status code')) {
                const baseUrl = provider.issuer?.endsWith('/.well-known/openid-configuration')
                    ? provider.issuer.replace('/.well-known/openid-configuration', '')
                    : provider.issuer;
                this.logger.log(`Attempted to fetch: ${baseUrl}/.well-known/openid-configuration`);
                this.logger.error(`Full error details: ${errorMessage}`);
            }

            return {
                isValid: false,
                error: userFriendlyError,
                details,
            };
        }
    }

    async performDiscovery(provider: OidcProvider, clientOptions?: any): Promise<client.Configuration> {
        if (!provider.issuer) {
            throw new Error('No issuer URL provided');
        }

        // Configure client auth method
        const clientAuth = provider.clientSecret
            ? client.ClientSecretPost(provider.clientSecret)
            : undefined;

        const serverUrl = new URL(provider.issuer);
        const discoveryUrl = `${provider.issuer}/.well-known/openid-configuration`;

        this.logger.log(`Starting discovery for provider ${provider.id}`);
        this.logger.log(`Discovery URL: ${discoveryUrl}`);
        this.logger.log(`Client ID: ${provider.clientId}`);
        this.logger.log(`Client secret configured: ${provider.clientSecret ? 'Yes' : 'No'}`);

        // Use provided client options or create default options with HTTP support if needed
        if (!clientOptions && serverUrl.protocol === 'http:') {
            this.logger.warn(
                `Allowing HTTP for ${provider.id} - This is insecure and should only be used for testing`
            );
            // For openid-client v6, use allowInsecureRequests in the execute array
            // This is deprecated but needed for local development with HTTP endpoints
            clientOptions = {
                execute: [client.allowInsecureRequests],
            };
        }

        try {
            const config = await client.discovery(
                serverUrl,
                provider.clientId,
                undefined, // client metadata
                clientAuth,
                clientOptions
            );

            this.logger.log(`Discovery successful for ${provider.id}`);
            this.logger.log(`Discovery response metadata:`);
            this.logger.log(`  - issuer: ${config.serverMetadata().issuer}`);
            this.logger.log(
                `  - authorization_endpoint: ${config.serverMetadata().authorization_endpoint}`
            );
            this.logger.log(`  - token_endpoint: ${config.serverMetadata().token_endpoint}`);
            this.logger.log(
                `  - userinfo_endpoint: ${config.serverMetadata().userinfo_endpoint || 'not provided'}`
            );
            this.logger.log(`  - jwks_uri: ${config.serverMetadata().jwks_uri || 'not provided'}`);
            this.logger.log(
                `  - response_types_supported: ${config.serverMetadata().response_types_supported?.join(', ') || 'not provided'}`
            );
            this.logger.log(
                `  - scopes_supported: ${config.serverMetadata().scopes_supported?.join(', ') || 'not provided'}`
            );

            return config;
        } catch (discoveryError) {
            this.logger.error(`Discovery failed for ${provider.id} at ${discoveryUrl}`);

            if (discoveryError instanceof Error) {
                this.logger.error('Discovery error: %o', discoveryError);
            }

            throw discoveryError;
        }
    }
}
