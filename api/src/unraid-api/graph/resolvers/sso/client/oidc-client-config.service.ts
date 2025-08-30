import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import * as client from 'openid-client';

import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/core/oidc-validation.service.js';
import { OidcProvider } from '@app/unraid-api/graph/resolvers/sso/models/oidc-provider.model.js';
import { ErrorExtractor } from '@app/unraid-api/utils/error-extractor.util.js';

@Injectable()
export class OidcClientConfigService {
    private readonly logger = new Logger(OidcClientConfigService.name);
    private readonly configCache = new Map<string, client.Configuration>();

    constructor(private readonly validationService: OidcValidationService) {}

    async getOrCreateConfig(provider: OidcProvider): Promise<client.Configuration> {
        const cacheKey = provider.id;

        if (this.configCache.has(cacheKey)) {
            return this.configCache.get(cacheKey)!;
        }

        try {
            // Use the validation service to perform discovery with HTTP support
            if (provider.issuer) {
                this.logger.debug(`Attempting discovery for ${provider.id} at ${provider.issuer}`);

                // Create client options with HTTP support if needed
                const serverUrl = new URL(provider.issuer);
                let clientOptions: client.DiscoveryRequestOptions | undefined;
                if (serverUrl.protocol === 'http:') {
                    this.logger.debug(`Allowing HTTP for ${provider.id} as specified by user`);
                    clientOptions = {
                        execute: [client.allowInsecureRequests],
                    };
                }

                try {
                    const config = await this.validationService.performDiscovery(
                        provider,
                        clientOptions
                    );
                    this.logger.debug(`Discovery successful for ${provider.id}`);
                    this.logger.debug(
                        `Authorization endpoint: ${config.serverMetadata().authorization_endpoint}`
                    );
                    this.logger.debug(`Token endpoint: ${config.serverMetadata().token_endpoint}`);
                    this.logger.debug(`JWKS URI: ${config.serverMetadata().jwks_uri || 'Not provided'}`);
                    this.logger.debug(
                        `Userinfo endpoint: ${config.serverMetadata().userinfo_endpoint || 'Not provided'}`
                    );
                    this.configCache.set(cacheKey, config);
                    return config;
                } catch (discoveryError) {
                    const extracted = ErrorExtractor.extract(discoveryError);
                    this.logger.warn(`Discovery failed for ${provider.id}: ${extracted.message}`);

                    // Log more details about the discovery error
                    const discoveryUrl = `${provider.issuer}/.well-known/openid-configuration`;
                    this.logger.debug(`Discovery URL attempted: ${discoveryUrl}`);

                    // Use error extractor for consistent logging
                    ErrorExtractor.formatForLogging(extracted, this.logger);

                    // If discovery fails but we have manual endpoints, use them
                    if (provider.authorizationEndpoint && provider.tokenEndpoint) {
                        this.logger.log(`Using manual endpoints for ${provider.id}`);
                        return this.createManualConfiguration(provider, cacheKey);
                    } else {
                        throw new Error(
                            `OIDC discovery failed and no manual endpoints provided for ${provider.id}`
                        );
                    }
                }
            }

            // Manual configuration when no issuer is provided
            if (provider.authorizationEndpoint && provider.tokenEndpoint) {
                this.logger.log(`Using manual endpoints for ${provider.id} (no issuer provided)`);
                return this.createManualConfiguration(provider, cacheKey);
            }

            // If we reach here, neither discovery nor manual endpoints are available
            throw new Error(
                `No configuration method available for ${provider.id}: requires either valid issuer for discovery or manual endpoints`
            );
        } catch (error) {
            const extracted = ErrorExtractor.extract(error);
            this.logger.error(
                `Failed to create OIDC configuration for ${provider.id}: ${extracted.message}`
            );

            // Log more details in debug mode
            if (extracted.stack) {
                this.logger.debug(`Stack trace: ${extracted.stack}`);
            }

            throw new UnauthorizedException('Provider configuration error');
        }
    }

    private createManualConfiguration(provider: OidcProvider, cacheKey: string): client.Configuration {
        // Create manual configuration
        const serverMetadata: client.ServerMetadata = {
            issuer: provider.issuer || `manual-${provider.id}`,
            authorization_endpoint: provider.authorizationEndpoint!,
            token_endpoint: provider.tokenEndpoint!,
            jwks_uri: provider.jwksUri,
        };

        const clientMetadata: Partial<client.ClientMetadata> = {
            client_secret: provider.clientSecret,
        };

        // Configure client auth method
        const clientAuth = provider.clientSecret
            ? client.ClientSecretPost(provider.clientSecret)
            : client.None();

        try {
            const config = new client.Configuration(
                serverMetadata,
                provider.clientId,
                clientMetadata,
                clientAuth
            );

            // Use manual configuration with HTTP support if needed
            const serverUrl = new URL(provider.tokenEndpoint!);
            if (serverUrl.protocol === 'http:') {
                this.logger.debug(`Allowing HTTP for manual endpoints on ${provider.id}`);
                // allowInsecureRequests is deprecated but still needed for HTTP endpoints
                client.allowInsecureRequests(config);
            }

            this.logger.debug(`Manual configuration created for ${provider.id}`);
            this.logger.debug(`Authorization endpoint: ${serverMetadata.authorization_endpoint}`);
            this.logger.debug(`Token endpoint: ${serverMetadata.token_endpoint}`);

            this.configCache.set(cacheKey, config);
            return config;
        } catch (manualConfigError) {
            const extracted = ErrorExtractor.extract(manualConfigError);
            this.logger.error(`Failed to create manual configuration: ${extracted.message}`);
            throw new Error(`Manual configuration failed for ${provider.id}`);
        }
    }

    clearCache(providerId?: string): void {
        if (providerId) {
            this.configCache.delete(providerId);
        } else {
            this.configCache.clear();
        }
    }

    getCacheSize(): number {
        return this.configCache.size;
    }
}
