import { Injectable, Logger } from '@nestjs/common';

import * as client from 'openid-client';

import { OidcProvider } from '@app/unraid-api/graph/resolvers/sso/oidc-provider.model.js';
import { ErrorExtractor } from '@app/unraid-api/utils/error-extractor.util.js';

// Extended type for our internal use - openid-client v6 doesn't directly expose
// skip options for aud/iss checks, so we'll handle validation errors differently
type ExtendedGrantChecks = client.AuthorizationCodeGrantChecks;

@Injectable()
export class OidcTokenExchangeService {
    private readonly logger = new Logger(OidcTokenExchangeService.name);

    async exchangeCodeForTokens(
        config: client.Configuration,
        provider: OidcProvider,
        code: string,
        state: string,
        redirectUri: string,
        fullCallbackUrl?: string
    ): Promise<client.TokenEndpointResponse> {
        this.logger.debug(`Provider ${provider.id} config loaded`);
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

        // For openid-client v6, we need to prepare the authorization response
        const authorizationResponse = new URLSearchParams(currentUrl.search);

        // Set the original client state for openid-client
        authorizationResponse.set('state', state);

        // Create a new URL with the cleaned parameters
        const cleanUrl = new URL(redirectUri);
        cleanUrl.search = authorizationResponse.toString();

        this.logger.debug(`Clean URL for token exchange: ${cleanUrl.href}`);

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
            this.logger.debug(`Expected state value: ${state}`);

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
                        // allowInsecureRequests is deprecated but still needed for HTTP endpoints
                        client.allowInsecureRequests(config);
                    }
                } catch (error) {
                    this.logger.warn(
                        `Invalid issuer URL for provider ${provider.id}: ${provider.issuer}`
                    );
                    // Continue without special HTTP options
                }
            }

            const requestChecks: ExtendedGrantChecks = {
                expectedState: state,
            };

            // Log what we're about to send
            this.logger.debug(`Executing authorizationCodeGrant with:`);
            this.logger.debug(`- Clean URL: ${cleanUrl.href}`);
            this.logger.debug(`- Expected state: ${state}`);
            this.logger.debug(`- Grant type: authorization_code`);

            const tokens = await client.authorizationCodeGrant(config, cleanUrl, requestChecks);

            this.logger.debug(
                `Token exchange successful, received tokens: ${Object.keys(tokens).join(', ')}`
            );

            return tokens;
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
    }
}
