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
import { OidcStateExtractor } from '@app/unraid-api/graph/resolvers/sso/oidc-state-extractor.util.js';
import { OidcStateService } from '@app/unraid-api/graph/resolvers/sso/oidc-state.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/oidc-validation.service.js';
import { ErrorExtractor } from '@app/unraid-api/utils/error-extractor.util.js';
import { validateRedirectUri } from '@app/unraid-api/utils/redirect-uri-validator.js';

interface JwtClaims {
    sub?: string;
    email?: string;
    name?: string;
    hd?: string; // Google hosted domain
    [claim: string]: unknown;
}

// Extended type for our internal use - openid-client v6 doesn't directly expose
// skip options for aud/iss checks, so we'll handle validation errors differently
type ExtendedGrantChecks = client.AuthorizationCodeGrantChecks;

@Injectable()
export class OidcAuthService {
    private readonly logger = new Logger(OidcAuthService.name);
    private readonly configCache = new Map<string, client.Configuration>();

    constructor(
        private readonly configService: ConfigService,
        private readonly oidcConfig: OidcConfigPersistence,
        private readonly sessionService: OidcSessionService,
        private readonly stateService: OidcStateService,
        private readonly validationService: OidcValidationService
    ) {}

    async getAuthorizationUrl(
        providerId: string,
        state: string,
        requestOrigin?: string,
        requestHeaders?: Record<string, string | string[] | undefined>
    ): Promise<string> {
        const provider = await this.oidcConfig.getProvider(providerId);
        if (!provider) {
            throw new UnauthorizedException(`Provider ${providerId} not found`);
        }

        // Use requestOrigin with validation
        // If requestOrigin provided, validate it
        // Otherwise fall back to generating from config
        const redirectUri = await (requestOrigin
            ? this.getRedirectUri(requestOrigin, requestHeaders)
            : this.getRedirectUri(undefined, requestHeaders));

        this.logger.debug(`Using redirect URI for authorization: ${redirectUri}`);
        this.logger.debug(`Request origin was: ${requestOrigin || 'not provided'}`);

        // Generate secure state with cryptographic signature, including redirect URI
        const secureState = await this.stateService.generateSecureState(providerId, state, redirectUri);

        // Build authorization URL
        if (provider.authorizationEndpoint) {
            // Use custom authorization endpoint
            const authUrl = new URL(provider.authorizationEndpoint);

            // Standard OAuth2 parameters
            authUrl.searchParams.set('client_id', provider.clientId);
            authUrl.searchParams.set('redirect_uri', redirectUri);
            authUrl.searchParams.set('scope', provider.scopes.join(' '));
            authUrl.searchParams.set('state', secureState);
            authUrl.searchParams.set('response_type', 'code');

            this.logger.debug(`Built authorization URL for provider ${provider.id}`);
            this.logger.debug(
                `Authorization parameters: client_id=${provider.clientId}, redirect_uri=${redirectUri}, scope=${provider.scopes.join(' ')}, response_type=code`
            );

            return authUrl.href;
        }

        // Use OIDC discovery for providers without custom endpoints
        const config = await this.getOrCreateConfig(provider);
        const parameters: Record<string, string> = {
            redirect_uri: redirectUri,
            scope: provider.scopes.join(' '),
            state: secureState,
            response_type: 'code',
        };

        // For HTTP endpoints, we need to call allowInsecureRequests on the config
        if (provider.issuer) {
            try {
                const serverUrl = new URL(provider.issuer);
                if (serverUrl.protocol === 'http:') {
                    this.logger.debug(`Allowing insecure requests for HTTP endpoint: ${provider.id}`);
                    client.allowInsecureRequests(config);
                }
            } catch (error) {
                this.logger.warn(`Invalid issuer URL for provider ${provider.id}: ${provider.issuer}`);
                // Continue without special HTTP options
            }
        }

        const authUrl = client.buildAuthorizationUrl(config, parameters);

        this.logger.log(`Built authorization URL via discovery for provider ${provider.id}`);
        this.logger.log(`Authorization parameters: ${JSON.stringify(parameters)}`);

        return authUrl.href;
    }

    extractProviderFromState(state: string): { providerId: string; originalState: string } {
        return OidcStateExtractor.extractProviderFromState(state, this.stateService);
    }

    /**
     * Get the state service for external utilities
     */
    getStateService(): OidcStateService {
        return this.stateService;
    }

    async handleCallback(
        providerId: string,
        code: string,
        state: string,
        requestOrigin?: string,
        fullCallbackUrl?: string,
        requestHeaders?: Record<string, string | string[] | undefined>
    ): Promise<string> {
        const provider = await this.oidcConfig.getProvider(providerId);
        if (!provider) {
            throw new UnauthorizedException(`Provider ${providerId} not found`);
        }

        // Extract and validate state, including the stored redirect URI
        const stateInfo = await OidcStateExtractor.extractAndValidateState(state, this.stateService);
        if (!stateInfo.redirectUri) {
            throw new UnauthorizedException('Missing redirect URI in state');
        }

        // Use the redirect URI that was stored during authorization
        const redirectUri = stateInfo.redirectUri;
        this.logger.debug(`Using stored redirect URI from state: ${redirectUri}`);

        try {
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

            // State was already validated in extractAndValidateState above, use that result
            // The clientState should be present after successful validation, but handle the edge case
            if (!stateInfo.clientState) {
                this.logger.warn('Client state missing after successful validation');
                throw new UnauthorizedException('Invalid state: missing client state');
            }
            const originalState = stateInfo.clientState;
            this.logger.debug(`Exchanging code for tokens with provider ${providerId}`);
            this.logger.debug(`Client state extracted: ${originalState}`);

            // For openid-client v6, we need to prepare the authorization response
            const authorizationResponse = new URLSearchParams(currentUrl.search);

            // Set the original client state for openid-client
            authorizationResponse.set('state', originalState);

            // Create a new URL with the cleaned parameters
            const cleanUrl = new URL(redirectUri);
            cleanUrl.search = authorizationResponse.toString();

            this.logger.debug(`Clean URL for token exchange: ${cleanUrl.href}`);

            let tokens: client.TokenEndpointResponse;
            try {
                this.logger.debug(`Starting token exchange with openid-client`);
                this.logger.debug(`Config issuer: ${config.serverMetadata().issuer}`);
                this.logger.debug(`Config token endpoint: ${config.serverMetadata().token_endpoint}`);

                // Log the complete token exchange request details
                const tokenEndpoint = config.serverMetadata().token_endpoint;
                this.logger.debug(`Full token endpoint URL: ${tokenEndpoint}`);
                this.logger.debug(`Authorization code: ${code.substring(0, 10)}...`);
                this.logger.debug(`Redirect URI in token request: ${redirectUri}`);
                this.logger.debug(`Client ID: ${provider.clientId}`);
                this.logger.debug(`Client secret configured: ${provider.clientSecret ? 'Yes' : 'No'}`);
                this.logger.debug(`Expected state value: ${originalState}`);

                // Log the server metadata to check for any configuration issues
                const metadata = config.serverMetadata();
                this.logger.debug(
                    `Server supports response types: ${metadata.response_types_supported?.join(', ') || 'not specified'}`
                );
                this.logger.debug(
                    `Server grant types: ${metadata.grant_types_supported?.join(', ') || 'not specified'}`
                );
                this.logger.debug(
                    `Token endpoint auth methods: ${metadata.token_endpoint_auth_methods_supported?.join(', ') || 'not specified'}`
                );

                // For HTTP endpoints, we need to call allowInsecureRequests on the config
                if (provider.issuer) {
                    try {
                        const serverUrl = new URL(provider.issuer);
                        if (serverUrl.protocol === 'http:') {
                            this.logger.debug(
                                `Allowing insecure requests for HTTP endpoint: ${provider.id}`
                            );
                            client.allowInsecureRequests(config);
                        }
                    } catch (error) {
                        this.logger.warn(
                            `Invalid issuer URL for provider ${provider.id}: ${provider.issuer}`
                        );
                        // Continue without special HTTP options
                    }
                }

                // Add request interceptor to log the actual request being sent
                const requestChecks: ExtendedGrantChecks = {
                    expectedState: originalState,
                };

                // Log what we're about to send
                this.logger.debug(`Executing authorizationCodeGrant with:`);
                this.logger.debug(`- Clean URL: ${cleanUrl.href}`);
                this.logger.debug(`- Expected state: ${originalState}`);
                this.logger.debug(`- Grant type: authorization_code`);

                tokens = await client.authorizationCodeGrant(config, cleanUrl, requestChecks);

                this.logger.debug(
                    `Token exchange successful, received tokens: ${Object.keys(tokens).join(', ')}`
                );
            } catch (tokenError) {
                // Extract and log error details using the utility
                const extracted = ErrorExtractor.extract(tokenError);
                this.logger.error('Token exchange failed');
                ErrorExtractor.formatForLogging(extracted, this.logger);

                // Special handling for content-type and parsing errors
                if (ErrorExtractor.isOAuthResponseError(extracted)) {
                    this.logger.error('Token endpoint returned invalid or non-JSON response.');
                    this.logger.error('This typically means:');
                    this.logger.error(
                        '1. The token endpoint URL is incorrect (check for typos or wrong paths)'
                    );
                    this.logger.error('2. The server returned an HTML error page instead of JSON');
                    this.logger.error('3. Authentication failed (invalid client_id or client_secret)');
                    this.logger.error('4. A proxy/firewall is intercepting the request');
                    this.logger.error('5. The OAuth server returned malformed JSON');
                    this.logger.error(
                        `Configured token endpoint: ${config.serverMetadata().token_endpoint}`
                    );
                    this.logger.error('Please verify your OIDC provider configuration.');
                }

                // Check if error message contains the "unexpected JWT claim" text
                if (ErrorExtractor.isJwtClaimError(extracted)) {
                    this.logger.error(
                        `unexpected JWT claim value encountered during token validation by openid-client`
                    );
                    this.logger.error(
                        `This error typically means the 'iss' claim in the JWT doesn't match the expected issuer`
                    );
                    this.logger.error(`Check that your provider's issuer URL is configured correctly`);
                    this.logger.error(`Expected issuer: ${config.serverMetadata().issuer}`);
                    this.logger.error(`Provider configured issuer: ${provider.issuer}`);
                }

                // Re-throw the original error with all its properties intact
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
            const extracted = ErrorExtractor.extract(error);
            this.logger.error(`OAuth callback error: ${extracted.message}`);
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
                            const extracted = ErrorExtractor.extract(manualConfigError);
                            this.logger.error(
                                `Failed to create manual configuration: ${extracted.message}`
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
                    const extracted = ErrorExtractor.extract(manualConfigError);
                    this.logger.error(`Failed to create manual configuration: ${extracted.message}`);
                    throw new Error(`Manual configuration failed for ${provider.id}`);
                }
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

        this.logger.debug('Authorization rules to evaluate: %o', provider.authorizationRules);

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

        this.logger.verbose(
            `Evaluating rule for claim ${rule.claim}: { claimType: ${typeof claimValue}, isArray: ${Array.isArray(claimValue)}, ruleOperator: ${rule.operator}, ruleValuesCount: ${rule.value.length} }`
        );

        if (claimValue === undefined || claimValue === null) {
            this.logger.verbose(`Claim ${rule.claim} not found in token`);
            return false;
        }

        // Handle non-array, non-string objects
        if (typeof claimValue === 'object' && claimValue !== null && !Array.isArray(claimValue)) {
            this.logger.warn(
                `unexpected JWT claim value encountered - claim ${rule.claim} has unsupported object type (keys: [${Object.keys(claimValue as Record<string, unknown>).join(', ')}])`
            );
            return false;
        }

        // Handle array claims - evaluate rule against each array element
        if (Array.isArray(claimValue)) {
            this.logger.verbose(
                `Processing array claim ${rule.claim} with ${claimValue.length} elements`
            );

            // For array claims, check if ANY element in the array matches the rule
            const arrayResult = claimValue.some((element) => {
                // Skip non-string elements
                if (
                    typeof element !== 'string' &&
                    typeof element !== 'number' &&
                    typeof element !== 'boolean'
                ) {
                    this.logger.verbose(`Skipping non-primitive element in array: ${typeof element}`);
                    return false;
                }

                const elementValue = String(element);
                return this.evaluateSingleValue(elementValue, rule);
            });

            this.logger.verbose(`Array evaluation result for claim ${rule.claim}: ${arrayResult}`);
            return arrayResult;
        }

        // Handle single value claims (string, number, boolean)
        const value = String(claimValue);
        this.logger.verbose(`Processing single value claim ${rule.claim}`);

        return this.evaluateSingleValue(value, rule);
    }

    private evaluateSingleValue(value: string, rule: OidcAuthorizationRule): boolean {
        let result: boolean;
        switch (rule.operator) {
            case AuthorizationOperator.EQUALS:
                result = rule.value.some((v) => value === v);
                this.logger.verbose(`EQUALS check: evaluated for claim ${rule.claim}: ${result}`);
                return result;

            case AuthorizationOperator.CONTAINS:
                result = rule.value.some((v) => value.includes(v));
                this.logger.verbose(`CONTAINS check: evaluated for claim ${rule.claim}: ${result}`);
                return result;

            case AuthorizationOperator.STARTS_WITH:
                result = rule.value.some((v) => value.startsWith(v));
                this.logger.verbose(`STARTS_WITH check: evaluated for claim ${rule.claim}: ${result}`);
                return result;

            case AuthorizationOperator.ENDS_WITH:
                result = rule.value.some((v) => value.endsWith(v));
                this.logger.verbose(`ENDS_WITH check: evaluated for claim ${rule.claim}: ${result}`);
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

    private async getRedirectUri(
        requestOrigin?: string,
        requestHeaders?: Record<string, string | string[] | undefined>
    ): Promise<string> {
        const CALLBACK_PATH = '/graphql/api/auth/oidc/callback';

        // Extract protocol and host from headers for validation
        const { protocol, host } = this.getRequestOriginInfo(requestHeaders);

        // If no requestOrigin provided, construct from headers or use fallback
        if (!requestOrigin) {
            if (protocol && host) {
                const redirectUri = `${protocol}://${host}${CALLBACK_PATH}`;
                this.logger.debug(`Using redirect URI from headers: ${redirectUri}`);
                return redirectUri;
            }
            // Fall back to configured BASE_URL
            const baseUrl = this.configService.get('BASE_URL', 'http://tower.local');
            this.logger.debug(`Using fallback redirect URI: ${baseUrl}${CALLBACK_PATH}`);
            return `${baseUrl}${CALLBACK_PATH}`;
        }

        // Get the global allowed origins from OIDC config
        const config = await this.oidcConfig.getConfig();
        const allowedOrigins = config?.defaultAllowedOrigins;

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
            const attemptedUri = requestOrigin || `${protocol}://${host}`;
            throw new UnauthorizedException(
                `Invalid redirect_uri: ${attemptedUri}. Please add this callback URI to Settings → Management Access → Allowed Redirect URIs`
            );
        }

        // Ensure the validated URI has the correct callback path
        try {
            const url = new URL(validation.validatedUri);
            // Only use origin to prevent path manipulation
            const redirectUri = `${url.origin}${CALLBACK_PATH}`;
            this.logger.debug(`Using validated redirect URI: ${redirectUri}`);
            return redirectUri;
        } catch (e) {
            this.logger.error(
                `Failed to construct redirect URI from validated URI: ${validation.validatedUri}`
            );
            throw new UnauthorizedException('Invalid redirect_uri');
        }
    }

    private getRequestOriginInfo(requestHeaders?: Record<string, string | string[] | undefined>): {
        protocol: string;
        host: string | undefined;
    } {
        if (!requestHeaders) {
            return { protocol: 'http', host: undefined };
        }

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

    private buildOriginWithPort(url: URL): string {
        // URL.origin properly handles IPv6, default ports, and URL composition
        return url.origin;
    }
}
