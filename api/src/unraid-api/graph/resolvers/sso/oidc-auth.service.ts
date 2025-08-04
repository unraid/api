import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as client from 'openid-client';

import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';
import {
    AuthorizationOperator,
    OidcAuthorizationRule,
    OidcProvider,
} from '@app/unraid-api/graph/resolvers/sso/oidc-provider.model.js';
import { OidcSessionService } from '@app/unraid-api/graph/resolvers/sso/oidc-session.service.js';

@Injectable()
export class OidcAuthService {
    private readonly logger = new Logger(OidcAuthService.name);
    private readonly configCache = new Map<string, client.Configuration>();

    constructor(
        private readonly configService: ConfigService,
        private readonly oidcConfig: OidcConfigPersistence,
        private readonly sessionService: OidcSessionService
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

            // Handle custom parameter names (e.g., Unraid.net uses 'callbackUrl' instead of 'redirect_uri')
            if (provider.customAuthParams) {
                authUrl.searchParams.set('callbackUrl', redirectUri);
                authUrl.searchParams.set('state', stateWithProvider);
                this.logger.debug(`Unraid.net callback URL: ${redirectUri}`);
            } else {
                // Standard OAuth2 parameters
                authUrl.searchParams.set('client_id', provider.clientId);
                authUrl.searchParams.set('redirect_uri', redirectUri);
                authUrl.searchParams.set('scope', provider.scopes.join(' '));
                authUrl.searchParams.set('state', stateWithProvider);
                authUrl.searchParams.set('response_type', 'code');
            }

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

            const tokens = await client.authorizationCodeGrant(config, cleanUrl, {
                expectedState: originalState,
            });

            // Parse ID token to get user info
            let claims: { sub?: string } | null = null;
            if (tokens.id_token) {
                try {
                    // Decode the JWT manually
                    const payload = tokens.id_token.split('.')[1];
                    claims = JSON.parse(Buffer.from(payload, 'base64').toString());
                    this.logger.debug(`ID token claims: ${JSON.stringify(claims)}`);
                } catch (e) {
                    this.logger.warn(`Failed to parse ID token: ${e}`);
                }
            }

            if (!claims?.sub) {
                throw new UnauthorizedException('No subject in token');
            }

            const userSub = claims.sub;

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
            // Configure client auth method
            const clientAuth = provider.clientSecret
                ? client.ClientSecretPost(provider.clientSecret)
                : undefined;

            let config: client.Configuration;

            // Try discovery first
            if (provider.issuer) {
                this.logger.debug(`Attempting discovery for ${provider.id} at ${provider.issuer}`);

                try {
                    const serverUrl = new URL(provider.issuer);

                    config = await client.discovery(
                        serverUrl,
                        provider.clientId,
                        undefined, // client metadata
                        clientAuth
                    );

                    this.configCache.set(cacheKey, config);
                    return config;
                } catch (discoveryError) {
                    this.logger.warn(
                        `Discovery failed for ${provider.id}: ${
                            discoveryError instanceof Error ? discoveryError.message : 'Unknown error'
                        }`
                    );

                    // If discovery fails but we have manual endpoints, use them
                    if (provider.authorizationEndpoint && provider.tokenEndpoint) {
                        this.logger.log(`Using manual endpoints for ${provider.id}`);
                    } else {
                        throw new Error(
                            `OIDC discovery failed and no manual endpoints provided for ${provider.id}`
                        );
                    }
                }
            }

            // Manual configuration when discovery fails or no issuer provided
            if (!provider.authorizationEndpoint || !provider.tokenEndpoint) {
                throw new Error(
                    `Manual endpoints required for ${provider.id} when discovery is not available`
                );
            }

            // Manual configuration is not supported yet with openid-client v6
            // For now, throw an error and require discovery
            throw new Error(
                `Manual configuration not yet implemented. Provider ${provider.id} must support OIDC discovery.`
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

    private async checkAuthorization(provider: OidcProvider, claims: any): Promise<void> {
        // If no authorization rules are specified, throw a helpful error
        if (!provider.authorizationRules || provider.authorizationRules.length === 0) {
            throw new UnauthorizedException(
                `Login failed: The ${provider.name} provider has no authorization rules configured. ` +
                    `Please configure authorization rules.`
            );
        }

        // Evaluate the rules
        const isAuthorized = this.evaluateAuthorizationRules(provider.authorizationRules, claims);

        if (!isAuthorized) {
            throw new UnauthorizedException(
                `Access denied: Your account does not meet the authorization requirements for ${provider.name}.`
            );
        }
    }

    private evaluateAuthorizationRules(rules: OidcAuthorizationRule[], claims: any): boolean {
        // All rules must pass (AND logic)
        // If you want OR logic, you can create multiple rules with the same claim
        return rules.every((rule) => this.evaluateRule(rule, claims));
    }

    private evaluateRule(rule: OidcAuthorizationRule, claims: any): boolean {
        const claimValue = claims[rule.claim];

        if (claimValue === undefined || claimValue === null) {
            this.logger.debug(`Claim ${rule.claim} not found in token`);
            return false;
        }

        const value = String(claimValue);

        switch (rule.operator) {
            case AuthorizationOperator.EQUALS:
                return rule.value.some((v) => value === v);

            case AuthorizationOperator.CONTAINS:
                return rule.value.some((v) => value.includes(v));

            case AuthorizationOperator.STARTS_WITH:
                return rule.value.some((v) => value.startsWith(v));

            case AuthorizationOperator.ENDS_WITH:
                return rule.value.some((v) => value.endsWith(v));

            default:
                this.logger.error(`Unknown authorization operator: ${rule.operator}`);
                return false;
        }
    }

    private getRedirectUri(requestHost?: string): string {
        // Always use the proxied path through /graphql to match production
        if (requestHost && requestHost.includes('localhost')) {
            // In development, use the Nuxt proxy at port 3000
            return `http://localhost:3000/graphql/api/auth/oidc/callback`;
        }

        // In production, use the configured base URL with /graphql prefix
        const baseUrl = this.configService.get('BASE_URL', 'http://tower.local');
        return `${baseUrl}/graphql/api/auth/oidc/callback`;
    }
}
