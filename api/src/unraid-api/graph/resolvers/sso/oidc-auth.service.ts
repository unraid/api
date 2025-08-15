import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { decodeJwt } from 'jose';
import * as client from 'openid-client';

import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';
import {
    AuthorizationOperator,
    AuthorizationRuleMode,
    OidcAuthorizationRule,
    OidcProvider,
} from '@app/unraid-api/graph/resolvers/sso/oidc-provider.model.js';
import { OidcSessionService } from '@app/unraid-api/graph/resolvers/sso/oidc-session.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/oidc-validation.service.js';

interface JwtClaims {
    sub?: string;
    email?: string;
    name?: string;
    hd?: string; // Google hosted domain
    [claim: string]: unknown;
}

@Injectable()
export class OidcAuthService {
    private readonly logger = new Logger(OidcAuthService.name);
    private readonly configCache = new Map<string, client.Configuration>();

    constructor(
        private readonly configService: ConfigService,
        private readonly oidcConfig: OidcConfigPersistence,
        private readonly sessionService: OidcSessionService,
        private readonly validationService: OidcValidationService
    ) {}

    async getAuthorizationUrl(providerId: string, state: string, requestHost?: string): Promise<string> {
        const provider = await this.oidcConfig.getProvider(providerId);
        if (!provider) {
            throw new UnauthorizedException(`Provider ${providerId} not found`);
        }

        const redirectUri = this.getRedirectUri(requestHost);

        // Encode provider ID in state for callback identification
        const stateWithProvider = `${providerId}:${state}`;

        // Build authorization URL
        if (provider.authorizationEndpoint) {
            // Use custom authorization endpoint
            const authUrl = new URL(provider.authorizationEndpoint);

            // Standard OAuth2 parameters
            authUrl.searchParams.set('client_id', provider.clientId);
            authUrl.searchParams.set('redirect_uri', redirectUri);
            authUrl.searchParams.set('scope', provider.scopes.join(' '));
            authUrl.searchParams.set('state', stateWithProvider);
            authUrl.searchParams.set('response_type', 'code');

            return authUrl.href;
        }

        // Use OIDC discovery for providers without custom endpoints
        const config = await this.getOrCreateConfig(provider);
        const parameters: Record<string, string> = {
            redirect_uri: redirectUri,
            scope: provider.scopes.join(' '),
            state: stateWithProvider,
            response_type: 'code',
        };

        // For HTTP endpoints, we need to pass the allowInsecureRequests option
        const serverUrl = new URL(provider.issuer || '');
        let clientOptions: any = undefined;
        if (serverUrl.protocol === 'http:') {
            this.logger.debug(
                `Building authorization URL with allowInsecureRequests for ${provider.id}`
            );
            clientOptions = {
                execute: [client.allowInsecureRequests],
            };
        }

        const authUrl = client.buildAuthorizationUrl(config, parameters);

        return authUrl.href;
    }

    extractProviderFromState(state: string): { providerId: string; originalState: string } {
        const parts = state.split(':');
        if (parts.length >= 2) {
            return {
                providerId: parts[0],
                originalState: parts.slice(1).join(':'),
            };
        }
        // Fallback for states without provider ID
        return {
            providerId: 'unraid.net',
            originalState: state,
        };
    }

    async handleCallback(
        providerId: string,
        code: string,
        state: string,
        requestHost?: string,
        fullCallbackUrl?: string
    ): Promise<string> {
        const provider = await this.oidcConfig.getProvider(providerId);
        if (!provider) {
            throw new UnauthorizedException(`Provider ${providerId} not found`);
        }

        try {
            const redirectUri = this.getRedirectUri(requestHost);

            // Always use openid-client for consistency
            const config = await this.getOrCreateConfig(provider);

            // Log configuration details
            this.logger.debug(`Provider ${providerId} config loaded`);
            this.logger.debug(`Redirect URI: ${redirectUri}`);

            // Build current URL for token exchange
            // CRITICAL: The URL used here MUST match the redirect_uri that was sent to the authorization endpoint
            // Google expects the exact same redirect_uri during token exchange
            const currentUrl = new URL(redirectUri);
            currentUrl.searchParams.set('code', code);
            currentUrl.searchParams.set('state', state);

            // Copy additional parameters from the actual callback if provided
            if (fullCallbackUrl) {
                const actualUrl = new URL(fullCallbackUrl);
                // Copy over additional params that Google might have added (scope, authuser, prompt, etc)
                // but DO NOT change the base URL or path
                ['scope', 'authuser', 'prompt', 'hd', 'session_state', 'iss'].forEach((param) => {
                    const value = actualUrl.searchParams.get(param);
                    if (value && !currentUrl.searchParams.has(param)) {
                        currentUrl.searchParams.set(param, value);
                    }
                });
            }

            // Google returns iss in the response, openid-client v6 expects it
            // If not present, add it based on the provider's issuer
            if (!currentUrl.searchParams.has('iss') && provider.issuer) {
                currentUrl.searchParams.set('iss', provider.issuer);
            }

            this.logger.debug(`Token exchange URL (matches redirect_uri): ${currentUrl.href}`);

            // Extract original state for validation
            const { originalState } = this.extractProviderFromState(state);

            this.logger.debug(`Exchanging code for tokens with provider ${providerId}`);
            this.logger.debug(`Expected state: ${originalState}`);

            // For openid-client v6, we need to validate the state ourselves
            // The library expects the authorization response to have specific parameters
            const authorizationResponse = new URLSearchParams(currentUrl.search);

            // Validate state parameter matches what we expect
            const responseState = authorizationResponse.get('state');
            if (responseState !== `${providerId}:${originalState}`) {
                throw new Error('State parameter mismatch');
            }

            // Remove our provider prefix from state before passing to openid-client
            authorizationResponse.set('state', originalState);

            // Create a new URL with the cleaned parameters
            const cleanUrl = new URL(redirectUri);
            cleanUrl.search = authorizationResponse.toString();

            this.logger.debug(`Clean URL for token exchange: ${cleanUrl.href}`);

            let tokens;
            try {
                this.logger.debug(`Starting token exchange with openid-client`);
                this.logger.debug(`Config issuer: ${config.serverMetadata().issuer}`);
                this.logger.debug(`Config token endpoint: ${config.serverMetadata().token_endpoint}`);

                // For HTTP endpoints, we need to pass the allowInsecureRequests option
                const serverUrl = new URL(provider.issuer || '');
                let clientOptions: any = undefined;
                if (serverUrl.protocol === 'http:') {
                    this.logger.debug(`Token exchange with allowInsecureRequests for ${provider.id}`);
                    clientOptions = {
                        execute: [client.allowInsecureRequests],
                    };
                }

                tokens = await client.authorizationCodeGrant(
                    config,
                    cleanUrl,
                    {
                        expectedState: originalState,
                    },
                    clientOptions
                );
                this.logger.debug(
                    `Token exchange successful, received tokens: ${Object.keys(tokens).join(', ')}`
                );
            } catch (tokenError) {
                const errorMessage =
                    tokenError instanceof Error ? tokenError.message : String(tokenError);
                this.logger.error(`Token exchange failed: ${errorMessage}`);

                // Check if error message contains the "unexpected JWT claim" text
                if (errorMessage.includes('unexpected JWT claim value encountered')) {
                    this.logger.error(
                        `unexpected JWT claim value encountered during token validation by openid-client`
                    );
                    this.logger.debug(
                        `Token exchange error details: ${JSON.stringify(tokenError, null, 2)}`
                    );

                    // Log the actual vs expected issuer
                    this.logger.error(
                        `This error typically means the 'iss' claim in the JWT doesn't match the expected issuer`
                    );
                    this.logger.error(`Check that your provider's issuer URL is configured correctly`);
                }

                throw tokenError;
            }

            // Parse ID token to get user info
            let claims: JwtClaims | null = null;
            if (tokens.id_token) {
                try {
                    // Use jose to properly decode the JWT
                    claims = decodeJwt(tokens.id_token) as JwtClaims;

                    // Log claims safely without PII - only structure, not values
                    if (claims) {
                        const claimKeys = Object.keys(claims).join(', ');
                        this.logger.debug(
                            `ID token decoded successfully. Available claims: [${claimKeys}]`
                        );

                        // Log claim types without exposing sensitive values
                        for (const [key, value] of Object.entries(claims)) {
                            const valueType = Array.isArray(value)
                                ? `array[${value.length}]`
                                : typeof value;

                            // Only log structure, not actual values (avoid PII)
                            this.logger.debug(`Claim '${key}': type=${valueType}`);

                            // Check for unexpected claim types
                            if (valueType === 'object' && value !== null && !Array.isArray(value)) {
                                this.logger.warn(`Claim '${key}' contains complex object structure`);
                            }
                        }
                    }
                } catch (e) {
                    this.logger.warn(`Failed to parse ID token: ${e}`);
                }
            } else {
                this.logger.error('No ID token received from provider');
            }

            if (!claims?.sub) {
                this.logger.error(
                    'No subject in token - claims available: ' +
                        (claims ? Object.keys(claims).join(', ') : 'none')
                );
                throw new UnauthorizedException('No subject in token');
            }

            const userSub = claims.sub;
            this.logger.debug(`Processing authentication for user: ${userSub}`);

            // Check authorization based on rules
            // This will throw a helpful error if misconfigured or unauthorized
            await this.checkAuthorization(provider, claims);

            // Create session and return padded token
            const paddedToken = await this.sessionService.createSession(providerId, userSub);

            this.logger.log(`Successfully authenticated user ${userSub} via provider ${providerId}`);

            return paddedToken;
        } catch (error) {
            this.logger.error(
                `OAuth callback error: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            // Re-throw the original error if it's already an UnauthorizedException
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            // Otherwise throw a generic error
            throw new UnauthorizedException('Authentication failed');
        }
    }

    private async getOrCreateConfig(provider: OidcProvider): Promise<client.Configuration> {
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
                let clientOptions: any = undefined;
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
                    this.configCache.set(cacheKey, config);
                    return config;
                } catch (discoveryError) {
                    const errorMessage =
                        discoveryError instanceof Error ? discoveryError.message : 'Unknown error';
                    this.logger.warn(`Discovery failed for ${provider.id}: ${errorMessage}`);

                    // Log more details about the discovery error
                    this.logger.debug(
                        `Discovery URL attempted: ${provider.issuer}/.well-known/openid-configuration`
                    );
                    this.logger.debug(
                        `Full discovery error: ${JSON.stringify(discoveryError, null, 2)}`
                    );

                    // Log stack trace for better debugging
                    if (discoveryError instanceof Error && discoveryError.stack) {
                        this.logger.debug(`Stack trace: ${discoveryError.stack}`);
                    }

                    // If discovery fails but we have manual endpoints, use them
                    if (provider.authorizationEndpoint && provider.tokenEndpoint) {
                        this.logger.log(`Using manual endpoints for ${provider.id}`);

                        // Create manual configuration
                        const serverMetadata: client.ServerMetadata = {
                            issuer: provider.issuer || `manual-${provider.id}`,
                            authorization_endpoint: provider.authorizationEndpoint,
                            token_endpoint: provider.tokenEndpoint,
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
                            const serverUrl = new URL(provider.tokenEndpoint);
                            if (serverUrl.protocol === 'http:') {
                                this.logger.debug(
                                    `Allowing HTTP for manual endpoints on ${provider.id}`
                                );
                                client.allowInsecureRequests(config);
                            }

                            this.logger.debug(`Manual configuration created for ${provider.id}`);
                            this.logger.debug(
                                `Authorization endpoint: ${serverMetadata.authorization_endpoint}`
                            );
                            this.logger.debug(`Token endpoint: ${serverMetadata.token_endpoint}`);

                            this.configCache.set(cacheKey, config);
                            return config;
                        } catch (manualConfigError) {
                            this.logger.error(
                                `Failed to create manual configuration: ${manualConfigError instanceof Error ? manualConfigError.message : 'Unknown error'}`
                            );
                            throw new Error(`Manual configuration failed for ${provider.id}`);
                        }
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

                // Create manual configuration
                const serverMetadata: client.ServerMetadata = {
                    issuer: provider.issuer || `manual-${provider.id}`,
                    authorization_endpoint: provider.authorizationEndpoint,
                    token_endpoint: provider.tokenEndpoint,
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
                    const serverUrl = new URL(provider.tokenEndpoint);
                    if (serverUrl.protocol === 'http:') {
                        this.logger.debug(`Allowing HTTP for manual endpoints on ${provider.id}`);
                        client.allowInsecureRequests(config);
                    }

                    this.logger.debug(`Manual configuration created for ${provider.id}`);
                    this.logger.debug(
                        `Authorization endpoint: ${serverMetadata.authorization_endpoint}`
                    );
                    this.logger.debug(`Token endpoint: ${serverMetadata.token_endpoint}`);

                    this.configCache.set(cacheKey, config);
                    return config;
                } catch (manualConfigError) {
                    this.logger.error(
                        `Failed to create manual configuration: ${manualConfigError instanceof Error ? manualConfigError.message : 'Unknown error'}`
                    );
                    throw new Error(`Manual configuration failed for ${provider.id}`);
                }
            }

            // If we reach here, neither discovery nor manual endpoints are available
            throw new Error(
                `No configuration method available for ${provider.id}: requires either valid issuer for discovery or manual endpoints`
            );
        } catch (error) {
            this.logger.error(
                `Failed to create OIDC configuration for ${provider.id}: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`
            );

            // Log more details in debug mode
            if (error instanceof Error && error.stack) {
                this.logger.debug(`Stack trace: ${error.stack}`);
            }

            throw new UnauthorizedException('Provider configuration error');
        }
    }

    private async checkAuthorization(provider: OidcProvider, claims: JwtClaims): Promise<void> {
        this.logger.debug(
            `Checking authorization for provider ${provider.id} with ${provider.authorizationRules?.length || 0} rules`
        );
        this.logger.debug(`Available claims: ${Object.keys(claims).join(', ')}`);
        this.logger.debug(
            `Authorization rule mode: ${provider.authorizationRuleMode || AuthorizationRuleMode.OR}`
        );

        // If no authorization rules are specified, throw a helpful error
        if (!provider.authorizationRules || provider.authorizationRules.length === 0) {
            throw new UnauthorizedException(
                `Login failed: The ${provider.name} provider has no authorization rules configured. ` +
                    `Please configure authorization rules.`
            );
        }

        this.logger.debug(
            `Authorization rules to evaluate: ${JSON.stringify(provider.authorizationRules, null, 2)}`
        );

        // Evaluate the rules
        const ruleMode = provider.authorizationRuleMode || AuthorizationRuleMode.OR;
        const isAuthorized = this.evaluateAuthorizationRules(
            provider.authorizationRules,
            claims,
            ruleMode
        );

        this.logger.debug(`Authorization result: ${isAuthorized}`);

        if (!isAuthorized) {
            // Log authorization failure with safe claim representation (no PII)
            const availableClaimKeys = Object.keys(claims).join(', ');
            this.logger.warn(
                `Authorization failed for provider ${provider.name}, user ${claims.sub}, available claim keys: [${availableClaimKeys}]`
            );
            throw new UnauthorizedException(
                `Access denied: Your account does not meet the authorization requirements for ${provider.name}.`
            );
        }

        this.logger.debug(`Authorization successful for user ${claims.sub}`);
    }

    private evaluateAuthorizationRules(
        rules: OidcAuthorizationRule[],
        claims: JwtClaims,
        mode: AuthorizationRuleMode = AuthorizationRuleMode.OR
    ): boolean {
        // No rules means no authorization
        if (rules.length === 0) {
            return false;
        }

        if (mode === AuthorizationRuleMode.AND) {
            // All rules must pass (AND logic)
            return rules.every((rule) => this.evaluateRule(rule, claims));
        } else {
            // Any rule can pass (OR logic) - default behavior
            // Multiple rules act as alternative authorization paths
            return rules.some((rule) => this.evaluateRule(rule, claims));
        }
    }

    private evaluateRule(rule: OidcAuthorizationRule, claims: JwtClaims): boolean {
        const claimValue = claims[rule.claim];

        this.logger.debug(
            `Evaluating rule for claim ${rule.claim}: ${JSON.stringify({
                claimValue,
                claimType: typeof claimValue,
                ruleOperator: rule.operator,
                ruleValues: rule.value,
            })}`
        );

        if (claimValue === undefined || claimValue === null) {
            this.logger.debug(`Claim ${rule.claim} not found in token`);
            return false;
        }

        // Log detailed claim analysis
        if (typeof claimValue === 'object' && claimValue !== null) {
            this.logger.warn(
                `unexpected JWT claim value encountered - claim ${rule.claim} is object type: ${JSON.stringify(claimValue)}`
            );
            return false;
        }

        if (Array.isArray(claimValue)) {
            this.logger.warn(
                `unexpected JWT claim value encountered - claim ${rule.claim} is array type: ${JSON.stringify(claimValue)}`
            );
            return false;
        }

        const value = String(claimValue);
        this.logger.debug(`Processing claim ${rule.claim} with string value: "${value}"`);

        let result: boolean;
        switch (rule.operator) {
            case AuthorizationOperator.EQUALS:
                result = rule.value.some((v) => value === v);
                this.logger.debug(
                    `EQUALS check: "${value}" matches any of [${rule.value.join(', ')}]: ${result}`
                );
                return result;

            case AuthorizationOperator.CONTAINS:
                result = rule.value.some((v) => value.includes(v));
                this.logger.debug(
                    `CONTAINS check: "${value}" contains any of [${rule.value.join(', ')}]: ${result}`
                );
                return result;

            case AuthorizationOperator.STARTS_WITH:
                result = rule.value.some((v) => value.startsWith(v));
                this.logger.debug(
                    `STARTS_WITH check: "${value}" starts with any of [${rule.value.join(', ')}]: ${result}`
                );
                return result;

            case AuthorizationOperator.ENDS_WITH:
                result = rule.value.some((v) => value.endsWith(v));
                this.logger.debug(
                    `ENDS_WITH check: "${value}" ends with any of [${rule.value.join(', ')}]: ${result}`
                );
                return result;

            default:
                this.logger.error(`Unknown authorization operator: ${rule.operator}`);
                return false;
        }
    }

    /**
     * Validate OIDC provider configuration by attempting discovery
     * Returns validation result with helpful error messages for debugging
     */
    async validateProvider(
        provider: OidcProvider
    ): Promise<{ isValid: boolean; error?: string; details?: unknown }> {
        // Clear any cached config for this provider to force fresh validation
        this.configCache.delete(provider.id);

        // Delegate to the validation service
        return this.validationService.validateProvider(provider);
    }

    private getRedirectUri(requestHost?: string): string {
        // Always use the proxied path through /graphql to match production
        if (requestHost && requestHost.includes('localhost')) {
            // In development, use the Nuxt proxy at port 3000
            return `http://localhost:3000/graphql/api/auth/oidc/callback`;
        }

        // In production, use the actual request host or configured base URL
        if (requestHost) {
            // Parse the host to handle port numbers properly
            const isLocalhost = requestHost.includes('localhost');
            const protocol = isLocalhost ? 'http' : 'https';

            // Remove standard ports (:443 for HTTPS, :80 for HTTP)
            let cleanHost = requestHost;
            if (!isLocalhost) {
                if (requestHost.endsWith(':443')) {
                    cleanHost = requestHost.slice(0, -4); // Remove :443
                } else if (requestHost.endsWith(':80')) {
                    cleanHost = requestHost.slice(0, -3); // Remove :80
                }
            }

            return `${protocol}://${cleanHost}/graphql/api/auth/oidc/callback`;
        }

        // Fall back to configured BASE_URL or default
        const baseUrl = this.configService.get('BASE_URL', 'http://tower.local');
        return `${baseUrl}/graphql/api/auth/oidc/callback`;
    }
}
