import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import * as client from 'openid-client';

import { OidcAuthorizationService } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-authorization.service.js';
import { OidcClaimsService } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-claims.service.js';
import { OidcTokenExchangeService } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-token-exchange.service.js';
import { OidcClientConfigService } from '@app/unraid-api/graph/resolvers/sso/client/oidc-client-config.service.js';
import { OidcRedirectUriService } from '@app/unraid-api/graph/resolvers/sso/client/oidc-redirect-uri.service.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/core/oidc-config.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/core/oidc-validation.service.js';
import { OidcProvider } from '@app/unraid-api/graph/resolvers/sso/models/oidc-provider.model.js';
import { OidcSessionService } from '@app/unraid-api/graph/resolvers/sso/session/oidc-session.service.js';
import { OidcStateExtractor } from '@app/unraid-api/graph/resolvers/sso/session/oidc-state-extractor.util.js';
import { OidcStateService } from '@app/unraid-api/graph/resolvers/sso/session/oidc-state.service.js';
import { ErrorExtractor } from '@app/unraid-api/utils/error-extractor.util.js';

export interface GetAuthorizationUrlParams {
    providerId: string;
    state: string;
    requestOrigin: string;
    requestHeaders: Record<string, string | string[] | undefined>;
}

export interface HandleCallbackParams {
    providerId: string;
    code: string;
    state: string;
    requestOrigin: string;
    fullCallbackUrl: string;
    requestHeaders: Record<string, string | string[] | undefined>;
}

@Injectable()
export class OidcService {
    private readonly logger = new Logger(OidcService.name);

    constructor(
        private readonly oidcConfig: OidcConfigPersistence,
        private readonly sessionService: OidcSessionService,
        private readonly stateService: OidcStateService,
        private readonly validationService: OidcValidationService,
        private readonly authorizationService: OidcAuthorizationService,
        private readonly redirectUriService: OidcRedirectUriService,
        private readonly clientConfigService: OidcClientConfigService,
        private readonly tokenExchangeService: OidcTokenExchangeService,
        private readonly claimsService: OidcClaimsService
    ) {}

    async getAuthorizationUrl(params: GetAuthorizationUrlParams): Promise<string> {
        const { providerId, state, requestOrigin, requestHeaders } = params;

        const provider = await this.oidcConfig.getProvider(providerId);
        if (!provider) {
            throw new UnauthorizedException(`Provider ${providerId} not found`);
        }

        // Use requestOrigin with validation
        const redirectUri = await this.redirectUriService.getRedirectUri(requestOrigin, requestHeaders);

        this.logger.debug(`Using redirect URI for authorization: ${redirectUri}`);
        this.logger.debug(`Request origin was: ${requestOrigin}`);

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
        const config = await this.clientConfigService.getOrCreateConfig(provider);
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
                    // allowInsecureRequests is deprecated but still needed for HTTP endpoints
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

    async handleCallback(params: HandleCallbackParams): Promise<string> {
        const { providerId, code, state, fullCallbackUrl } = params;

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
            const config = await this.clientConfigService.getOrCreateConfig(provider);

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

            // Use the token exchange service
            const tokens = await this.tokenExchangeService.exchangeCodeForTokens(
                config,
                provider,
                code,
                originalState,
                redirectUri,
                fullCallbackUrl
            );

            // Parse ID token to get user info
            const claims = this.claimsService.parseIdToken(tokens.id_token);
            const userSub = this.claimsService.validateClaims(claims);

            // Check authorization based on rules
            // This will throw a helpful error if misconfigured or unauthorized
            await this.authorizationService.checkAuthorization(provider, claims!);

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

    /**
     * Validate OIDC provider configuration by attempting discovery
     * Returns validation result with helpful error messages for debugging
     */
    async validateProvider(
        provider: OidcProvider
    ): Promise<{ isValid: boolean; error?: string; details?: unknown }> {
        // Clear any cached config for this provider to force fresh validation
        this.clientConfigService.clearCache(provider.id);

        // Delegate to the validation service
        return this.validationService.validateProvider(provider);
    }
}
