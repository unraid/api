import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as client from 'openid-client';

import { OidcProvider } from '@app/unraid-api/graph/resolvers/sso/oidc-provider.model.js';

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
                this.logger.debug(
                    `HTTP issuer URL detected for provider ${provider.id}: ${provider.issuer}`
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
            this.logger.debug(`Raw discovery error for ${provider.id}: ${errorMessage}`);

            // Log additional error details if available
            if (error instanceof Error) {
                this.logger.debug(`Error type: ${error.constructor.name}`);
                if ('stack' in error && error.stack) {
                    this.logger.debug(`Stack trace: ${error.stack}`);
                }
                if ('response' in error) {
                    const response = (error as any).response;
                    if (response) {
                        this.logger.debug(`Response status: ${response.status}`);
                        this.logger.debug(`Response body: ${response.body}`);
                    }
                }
            }

            // Provide specific error messages for common issues
            let userFriendlyError = errorMessage;
            let details: Record<string, unknown> = {};

            // Check for fetch-specific errors (Node.js fetch API)
            if (errorMessage.includes('fetch failed')) {
                // Try to extract more specific information from the error
                if (error instanceof Error && 'cause' in error) {
                    const cause = (error as any).cause;
                    if (cause) {
                        this.logger.debug(`Fetch error cause: ${JSON.stringify(cause, null, 2)}`);

                        // Check the cause for specific error types
                        if (cause.code === 'ENOTFOUND' || cause.message?.includes('ENOTFOUND')) {
                            userFriendlyError = `Cannot resolve domain name. Please check that '${provider.issuer}' is accessible and spelled correctly.`;
                            details = {
                                type: 'DNS_ERROR',
                                originalError: errorMessage,
                                cause: cause.message || cause.code,
                            };
                        } else if (
                            cause.code === 'ECONNREFUSED' ||
                            cause.message?.includes('ECONNREFUSED')
                        ) {
                            userFriendlyError = `Connection refused. The server at '${provider.issuer}' is not accepting connections.`;
                            details = {
                                type: 'CONNECTION_ERROR',
                                originalError: errorMessage,
                                cause: cause.message || cause.code,
                            };
                        } else if (
                            cause.code === 'CERT_HAS_EXPIRED' ||
                            cause.message?.includes('certificate')
                        ) {
                            userFriendlyError = `SSL/TLS certificate error. The server certificate may be invalid or expired.`;
                            details = {
                                type: 'SSL_ERROR',
                                originalError: errorMessage,
                                cause: cause.message || cause.code,
                            };
                        } else if (cause.code === 'ETIMEDOUT' || cause.message?.includes('ETIMEDOUT')) {
                            userFriendlyError = `Connection timeout. The server at '${provider.issuer}' is not responding.`;
                            details = {
                                type: 'TIMEOUT_ERROR',
                                originalError: errorMessage,
                                cause: cause.message || cause.code,
                            };
                        } else {
                            // Generic fetch failed with cause details
                            userFriendlyError = `Failed to connect to OIDC provider at '${provider.issuer}'. ${cause.message || cause.code || 'Unknown network error'}`;
                            details = {
                                type: 'FETCH_ERROR',
                                originalError: errorMessage,
                                cause: cause.message || cause.code,
                            };
                        }
                    } else {
                        // Generic fetch failed without cause
                        userFriendlyError = `Failed to connect to OIDC provider at '${provider.issuer}'. Please verify the URL is correct and accessible.`;
                        details = { type: 'FETCH_ERROR', originalError: errorMessage };
                    }
                } else {
                    // Fetch failed but no cause information
                    userFriendlyError = `Failed to connect to OIDC provider at '${provider.issuer}'. Please verify the URL is correct and accessible.`;
                    details = { type: 'FETCH_ERROR', originalError: errorMessage };
                }
            } else if (errorMessage.includes('getaddrinfo ENOTFOUND')) {
                userFriendlyError = `Cannot resolve domain name. Please check that '${provider.issuer}' is accessible and spelled correctly.`;
                details = { type: 'DNS_ERROR', originalError: errorMessage };
            } else if (errorMessage.includes('ECONNREFUSED')) {
                userFriendlyError = `Connection refused. The server at '${provider.issuer}' is not accepting connections.`;
                details = { type: 'CONNECTION_ERROR', originalError: errorMessage };
            } else if (errorMessage.includes('ECONNRESET') || errorMessage.includes('ETIMEDOUT')) {
                userFriendlyError = `Connection timeout. The server at '${provider.issuer}' is not responding.`;
                details = { type: 'TIMEOUT_ERROR', originalError: errorMessage };
            } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
                const baseUrl = provider.issuer?.endsWith('/.well-known/openid-configuration')
                    ? provider.issuer.replace('/.well-known/openid-configuration', '')
                    : provider.issuer;
                userFriendlyError = `OIDC discovery endpoint not found. Please verify that '${baseUrl}/.well-known/openid-configuration' exists.`;
                details = { type: 'DISCOVERY_NOT_FOUND', originalError: errorMessage };
            } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
                userFriendlyError = `Access denied to discovery endpoint. Please check the issuer URL and any authentication requirements.`;
                details = { type: 'AUTHENTICATION_ERROR', originalError: errorMessage };
            } else if (errorMessage.includes('unexpected HTTP response status code')) {
                // Extract status code if possible
                const statusMatch = errorMessage.match(/status code (\d+)/);
                const statusCode = statusMatch ? statusMatch[1] : 'unknown';
                const baseUrl = provider.issuer?.endsWith('/.well-known/openid-configuration')
                    ? provider.issuer.replace('/.well-known/openid-configuration', '')
                    : provider.issuer;
                userFriendlyError = `HTTP ${statusCode} error from discovery endpoint. Please check that '${baseUrl}/.well-known/openid-configuration' returns a valid OIDC discovery document.`;
                details = { type: 'HTTP_STATUS_ERROR', statusCode, originalError: errorMessage };
            } else if (
                errorMessage.includes('certificate') ||
                errorMessage.includes('SSL') ||
                errorMessage.includes('TLS')
            ) {
                userFriendlyError = `SSL/TLS certificate error. The server certificate may be invalid or expired.`;
                details = { type: 'SSL_ERROR', originalError: errorMessage };
            } else if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
                userFriendlyError = `Invalid OIDC discovery response. The server returned malformed JSON.`;
                details = { type: 'INVALID_JSON', originalError: errorMessage };
            } else if (error && (error as any).code === 'OAUTH_RESPONSE_IS_NOT_CONFORM') {
                const baseUrl = provider.issuer?.endsWith('/.well-known/openid-configuration')
                    ? provider.issuer.replace('/.well-known/openid-configuration', '')
                    : provider.issuer;
                userFriendlyError = `Invalid OIDC discovery document. The server at '${baseUrl}/.well-known/openid-configuration' returned a response that doesn't conform to the OpenID Connect Discovery specification. Please verify the endpoint returns valid OIDC metadata.`;
                details = { type: 'INVALID_OIDC_DOCUMENT', originalError: errorMessage };
            }

            this.logger.warn(`OIDC validation failed for provider ${provider.id}: ${errorMessage}`);

            // Add debug logging for HTTP status errors
            if (errorMessage.includes('unexpected HTTP response status code')) {
                const baseUrl = provider.issuer?.endsWith('/.well-known/openid-configuration')
                    ? provider.issuer.replace('/.well-known/openid-configuration', '')
                    : provider.issuer;
                this.logger.debug(`Attempted to fetch: ${baseUrl}/.well-known/openid-configuration`);
                this.logger.debug(`Full error details: ${errorMessage}`);
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

        this.logger.debug(`Starting OIDC discovery for provider ${provider.id}`);
        this.logger.debug(`Discovery URL: ${discoveryUrl}`);
        this.logger.debug(`Client ID: ${provider.clientId}`);
        this.logger.debug(`Client secret configured: ${provider.clientSecret ? 'Yes' : 'No'}`);

        // Use provided client options or create default options with HTTP support if needed
        if (!clientOptions && serverUrl.protocol === 'http:') {
            this.logger.debug(`Allowing HTTP for ${provider.id} as specified by user`);
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

            this.logger.debug(`Discovery successful for ${provider.id}`);
            this.logger.debug(`Discovery response metadata:`);
            this.logger.debug(`  - issuer: ${config.serverMetadata().issuer}`);
            this.logger.debug(
                `  - authorization_endpoint: ${config.serverMetadata().authorization_endpoint}`
            );
            this.logger.debug(`  - token_endpoint: ${config.serverMetadata().token_endpoint}`);
            this.logger.debug(
                `  - userinfo_endpoint: ${config.serverMetadata().userinfo_endpoint || 'not provided'}`
            );
            this.logger.debug(`  - jwks_uri: ${config.serverMetadata().jwks_uri || 'not provided'}`);
            this.logger.debug(
                `  - response_types_supported: ${config.serverMetadata().response_types_supported?.join(', ') || 'not provided'}`
            );
            this.logger.debug(
                `  - scopes_supported: ${config.serverMetadata().scopes_supported?.join(', ') || 'not provided'}`
            );

            return config;
        } catch (discoveryError) {
            this.logger.error(`Discovery failed for ${provider.id} at ${discoveryUrl}`);

            if (discoveryError instanceof Error) {
                this.logger.error(`Error type: ${discoveryError.constructor.name}`);
                this.logger.error(`Error message: ${discoveryError.message}`);

                // Log response details if available
                if ('response' in discoveryError) {
                    const response = (discoveryError as any).response;
                    if (response) {
                        this.logger.error(`HTTP Status: ${response.status}`);
                        this.logger.error(`HTTP Status Text: ${response.statusText}`);
                        if (response.body) {
                            this.logger.error(
                                `Response body: ${typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2)}`
                            );
                        }
                    }
                }

                // Log cause if available
                if ('cause' in discoveryError && discoveryError.cause) {
                    this.logger.error(`Error cause: ${JSON.stringify(discoveryError.cause, null, 2)}`);
                }
            }

            throw discoveryError;
        }
    }
}
