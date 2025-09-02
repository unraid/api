import { Logger } from '@nestjs/common';

export interface OidcErrorDetails {
    userFriendlyError: string;
    details: Record<string, unknown>;
}

export class OidcErrorHelper {
    private static readonly logger = new Logger(OidcErrorHelper.name);

    /**
     * Parse fetch errors and return user-friendly error messages
     */
    static parseFetchError(error: unknown, issuerUrl?: string): OidcErrorDetails {
        const errorMessage = error instanceof Error ? error.message : String(error);
        let userFriendlyError = errorMessage;
        let details: Record<string, unknown> = { originalError: errorMessage };

        // Extract cause information if available
        if (error instanceof Error && 'cause' in error) {
            const cause = (error as any).cause;
            if (cause) {
                this.logger.log('Fetch error cause: %o', cause);

                const errorCode = cause.code || '';
                const causeMessage = cause.message || '';

                // Map error codes to user-friendly messages
                switch (errorCode) {
                    case 'ENOTFOUND':
                        userFriendlyError = `Cannot resolve domain name. Please check that '${issuerUrl}' is accessible and spelled correctly.`;
                        details = {
                            type: 'DNS_ERROR',
                            originalError: errorMessage,
                            cause: causeMessage || errorCode,
                        };
                        break;

                    case 'ECONNREFUSED':
                        userFriendlyError = `Connection refused. The server at '${issuerUrl}' is not accepting connections.`;
                        details = {
                            type: 'CONNECTION_ERROR',
                            originalError: errorMessage,
                            cause: causeMessage || errorCode,
                        };
                        break;

                    case 'CERT_HAS_EXPIRED':
                        userFriendlyError = `SSL/TLS certificate error. The server certificate may be invalid or expired.`;
                        details = {
                            type: 'SSL_ERROR',
                            originalError: errorMessage,
                            cause: causeMessage || errorCode,
                        };
                        break;

                    case 'ETIMEDOUT':
                        userFriendlyError = `Connection timeout. The server at '${issuerUrl}' is not responding.`;
                        details = {
                            type: 'TIMEOUT_ERROR',
                            originalError: errorMessage,
                            cause: causeMessage || errorCode,
                        };
                        break;

                    default:
                        // Check message patterns if code doesn't match
                        if (causeMessage.includes('ENOTFOUND')) {
                            userFriendlyError = `Cannot resolve domain name. Please check that '${issuerUrl}' is accessible and spelled correctly.`;
                            details = {
                                type: 'DNS_ERROR',
                                originalError: errorMessage,
                                cause: causeMessage,
                            };
                        } else if (causeMessage.includes('ECONNREFUSED')) {
                            userFriendlyError = `Connection refused. The server at '${issuerUrl}' is not accepting connections.`;
                            details = {
                                type: 'CONNECTION_ERROR',
                                originalError: errorMessage,
                                cause: causeMessage,
                            };
                        } else if (
                            causeMessage.includes('certificate') ||
                            causeMessage.includes('SSL') ||
                            causeMessage.includes('TLS')
                        ) {
                            userFriendlyError = `SSL/TLS certificate error. The server certificate may be invalid or expired.`;
                            details = {
                                type: 'SSL_ERROR',
                                originalError: errorMessage,
                                cause: causeMessage,
                            };
                        } else if (causeMessage.includes('ETIMEDOUT')) {
                            userFriendlyError = `Connection timeout. The server at '${issuerUrl}' is not responding.`;
                            details = {
                                type: 'TIMEOUT_ERROR',
                                originalError: errorMessage,
                                cause: causeMessage,
                            };
                        } else {
                            userFriendlyError = `Failed to connect to OIDC provider at '${issuerUrl}'. ${causeMessage || errorCode || 'Unknown network error'}`;
                            details = {
                                type: 'FETCH_ERROR',
                                originalError: errorMessage,
                                cause: causeMessage || errorCode,
                            };
                        }
                        break;
                }
            } else {
                // Generic fetch failed without cause
                userFriendlyError = `Failed to connect to OIDC provider at '${issuerUrl}'. Please verify the URL is correct and accessible.`;
                details = { type: 'FETCH_ERROR', originalError: errorMessage };
            }
        } else if (errorMessage.includes('fetch failed')) {
            // Fetch failed but no cause information
            userFriendlyError = `Failed to connect to OIDC provider at '${issuerUrl}'. Please verify the URL is correct and accessible.`;
            details = { type: 'FETCH_ERROR', originalError: errorMessage };
        }

        return { userFriendlyError, details };
    }

    /**
     * Parse HTTP status errors and return user-friendly error messages
     */
    static parseHttpError(errorMessage: string, issuerUrl?: string): OidcErrorDetails {
        let userFriendlyError = errorMessage;
        let details: Record<string, unknown> = { originalError: errorMessage };

        if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
            const baseUrl = issuerUrl?.endsWith('/.well-known/openid-configuration')
                ? issuerUrl.replace('/.well-known/openid-configuration', '')
                : issuerUrl;
            userFriendlyError = `OIDC discovery endpoint not found. Please verify that '${baseUrl}/.well-known/openid-configuration' exists.`;
            details = { type: 'DISCOVERY_NOT_FOUND', originalError: errorMessage };
        } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
            userFriendlyError = `Access denied to discovery endpoint. Please check the issuer URL and any authentication requirements.`;
            details = { type: 'AUTHENTICATION_ERROR', originalError: errorMessage };
        } else if (errorMessage.includes('unexpected HTTP response status code')) {
            // Extract status code if possible
            const statusMatch = errorMessage.match(/status code (\d+)/);
            const statusCode = statusMatch ? statusMatch[1] : 'unknown';
            const baseUrl = issuerUrl?.endsWith('/.well-known/openid-configuration')
                ? issuerUrl.replace('/.well-known/openid-configuration', '')
                : issuerUrl;
            userFriendlyError = `HTTP ${statusCode} error from discovery endpoint. Please check that '${baseUrl}/.well-known/openid-configuration' returns a valid OIDC discovery document.`;
            details = { type: 'HTTP_STATUS_ERROR', statusCode, originalError: errorMessage };
        }

        return { userFriendlyError, details };
    }

    /**
     * Parse generic OIDC errors and return user-friendly error messages
     */
    static parseGenericError(error: unknown, issuerUrl?: string): OidcErrorDetails {
        const errorMessage = error instanceof Error ? error.message : String(error);
        let userFriendlyError = errorMessage;
        let details: Record<string, unknown> = { originalError: errorMessage };

        // Check for specific error patterns
        if (errorMessage.includes('getaddrinfo ENOTFOUND')) {
            userFriendlyError = `Cannot resolve domain name. Please check that '${issuerUrl}' is accessible and spelled correctly.`;
            details = { type: 'DNS_ERROR', originalError: errorMessage };
        } else if (errorMessage.includes('ECONNREFUSED')) {
            userFriendlyError = `Connection refused. The server at '${issuerUrl}' is not accepting connections.`;
            details = { type: 'CONNECTION_ERROR', originalError: errorMessage };
        } else if (errorMessage.includes('ECONNRESET') || errorMessage.includes('ETIMEDOUT')) {
            userFriendlyError = `Connection timeout. The server at '${issuerUrl}' is not responding.`;
            details = { type: 'TIMEOUT_ERROR', originalError: errorMessage };
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
            const baseUrl = issuerUrl?.endsWith('/.well-known/openid-configuration')
                ? issuerUrl.replace('/.well-known/openid-configuration', '')
                : issuerUrl;
            userFriendlyError = `Invalid OIDC discovery document. The server at '${baseUrl}/.well-known/openid-configuration' returned a response that doesn't conform to the OpenID Connect Discovery specification. Please verify the endpoint returns valid OIDC metadata.`;
            details = { type: 'INVALID_OIDC_DOCUMENT', originalError: errorMessage };
        }

        return { userFriendlyError, details };
    }

    /**
     * Parse OIDC discovery errors and return user-friendly error messages
     */
    static parseDiscoveryError(error: unknown, issuerUrl?: string): OidcErrorDetails {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Log additional error details for debugging
        if (error instanceof Error) {
            this.logger.log(`Error type: ${error.constructor.name}`);
            if ('stack' in error && error.stack) {
                this.logger.debug(`Stack trace: ${error.stack}`);
            }
            if ('response' in error) {
                const response = (error as any).response;
                if (response) {
                    this.logger.log(`Response status: ${response.status}`);
                    this.logger.log(`Response body: ${response.body}`);
                }
            }
        }

        // Check for fetch-specific errors first
        if (errorMessage.includes('fetch failed')) {
            return this.parseFetchError(error, issuerUrl);
        }

        // Check for HTTP status errors
        const httpError = this.parseHttpError(errorMessage, issuerUrl);
        // Proper type-narrowing guard for accessing details.type
        if (
            httpError.details &&
            typeof httpError.details === 'object' &&
            'type' in httpError.details &&
            httpError.details.type !== undefined
        ) {
            return httpError;
        }

        // Fall back to generic error parsing
        return this.parseGenericError(error, issuerUrl);
    }
}
