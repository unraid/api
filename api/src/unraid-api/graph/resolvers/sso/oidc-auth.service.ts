import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as client from 'openid-client';

import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';
import { OidcProvider } from '@app/unraid-api/graph/resolvers/sso/oidc-provider.model.js';
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

        // Build authorization URL
        if (provider.authorizationEndpoint) {
            // Use custom authorization endpoint
            const authUrl = new URL(provider.authorizationEndpoint);

            // Handle custom parameter names (e.g., Unraid.net uses 'callbackUrl' instead of 'redirect_uri')
            if (provider.customAuthParams) {
                authUrl.searchParams.set('callbackUrl', redirectUri);
                authUrl.searchParams.set('state', state);
                this.logger.debug(`Unraid.net callback URL: ${redirectUri}`);
            } else {
                // Standard OAuth2 parameters
                authUrl.searchParams.set('client_id', provider.clientId);
                authUrl.searchParams.set('redirect_uri', redirectUri);
                authUrl.searchParams.set('scope', provider.scopes.join(' '));
                authUrl.searchParams.set('state', state);
                authUrl.searchParams.set('response_type', 'code');
            }

            return authUrl.href;
        }

        // Use OIDC discovery for providers without custom endpoints
        const config = await this.getOrCreateConfig(provider);
        const parameters: Record<string, string> = {
            redirect_uri: redirectUri,
            scope: provider.scopes.join(' '),
            state,
            response_type: 'code',
        };

        const authUrl = client.buildAuthorizationUrl(config, parameters);

        return authUrl.href;
    }

    async handleCallback(
        providerId: string,
        code: string,
        state: string,
        requestHost?: string
    ): Promise<string> {
        const provider = await this.oidcConfig.getProvider(providerId);
        if (!provider) {
            throw new UnauthorizedException(`Provider ${providerId} not found`);
        }

        try {
            const redirectUri = this.getRedirectUri(requestHost);

            // For providers with manual endpoints, do manual token exchange
            if (provider.tokenEndpoint) {
                const tokenUrl = new URL(provider.tokenEndpoint);

                const body = new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: redirectUri,
                    client_id: provider.clientId,
                });

                if (provider.clientSecret) {
                    body.append('client_secret', provider.clientSecret);
                }

                const response = await fetch(tokenUrl.href, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: body.toString(),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    this.logger.error(`Token exchange failed: ${response.status} - ${errorText}`);
                    throw new UnauthorizedException('Token exchange failed');
                }

                const tokens = await response.json();
                this.logger.debug(`Token response: ${JSON.stringify(tokens)}`);

                // Parse the ID token to get user info
                let userSub = 'unknown-user';
                if (tokens.id_token) {
                    try {
                        const payload = tokens.id_token.split('.')[1];
                        const claims = JSON.parse(Buffer.from(payload, 'base64').toString());
                        this.logger.debug(`ID token claims: ${JSON.stringify(claims)}`);
                        userSub = claims.sub || userSub;
                    } catch (e) {
                        this.logger.warn('Failed to parse ID token', e);
                    }
                } else if (tokens.access_token) {
                    // Maybe Unraid.net returns a different token format
                    this.logger.debug('No ID token, checking access token');
                    try {
                        const payload = tokens.access_token.split('.')[1];
                        const claims = JSON.parse(Buffer.from(payload, 'base64').toString());
                        this.logger.debug(`Access token claims: ${JSON.stringify(claims)}`);
                        userSub = claims.sub || userSub;
                    } catch (e) {
                        this.logger.warn('Failed to parse access token', e);
                    }
                }

                // Check if user is authorized
                if (
                    provider.authorizedSubIds.length > 0 &&
                    !provider.authorizedSubIds.includes(userSub)
                ) {
                    throw new UnauthorizedException(
                        `User ${userSub} not authorized for provider ${providerId}`
                    );
                }

                // Create session and return padded token
                const paddedToken = this.sessionService.createSession(providerId, userSub);

                this.logger.log(`Successfully authenticated user ${userSub} via provider ${providerId}`);

                return paddedToken;
            }

            // For providers with discovery, use the standard flow
            const config = await this.getOrCreateConfig(provider);

            // Build current URL for token exchange
            const currentUrl = new URL(redirectUri);
            currentUrl.searchParams.set('code', code);
            currentUrl.searchParams.set('state', state);

            // Exchange authorization code for tokens
            const tokens = await client.authorizationCodeGrant(config, currentUrl, {
                expectedState: state,
            });

            // Parse ID token to get user info
            let claims: { sub?: string } | null = null;
            if (tokens.id_token) {
                try {
                    // For v6, decode the JWT manually
                    const payload = tokens.id_token.split('.')[1];
                    claims = JSON.parse(Buffer.from(payload, 'base64').toString());
                } catch (e) {
                    this.logger.warn('Failed to parse ID token');
                }
            }

            if (!claims?.sub) {
                throw new UnauthorizedException('No subject in token');
            }

            const userSub = claims.sub;

            // Check if user is authorized
            if (provider.authorizedSubIds.length > 0 && !provider.authorizedSubIds.includes(userSub)) {
                throw new UnauthorizedException(
                    `User ${userSub} not authorized for provider ${providerId}`
                );
            }

            // Create session and return padded token
            const paddedToken = await this.sessionService.createSession(providerId, userSub);

            this.logger.log(`Successfully authenticated user ${userSub} via provider ${providerId}`);

            return paddedToken;
        } catch (error) {
            this.logger.error(
                `OAuth callback error: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
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

            // Only use discovery for providers without manual endpoints
            if (!provider.tokenEndpoint) {
                // Try discovery
                this.logger.debug(`Attempting discovery for ${provider.id} at ${provider.issuer}`);

                try {
                    const serverUrl = new URL(provider.issuer);
                    config = await client.discovery(
                        serverUrl,
                        provider.clientId,
                        undefined, // client metadata
                        clientAuth
                    );
                } catch (discoveryError) {
                    this.logger.warn(
                        `Discovery failed for ${provider.id}: ${
                            discoveryError instanceof Error ? discoveryError.message : 'Unknown error'
                        }. Falling back to manual configuration if endpoints are provided.`
                    );

                    // If discovery fails but we don't have manual endpoints, throw
                    if (!provider.authorizationEndpoint || !provider.tokenEndpoint) {
                        throw new Error(
                            `OIDC discovery failed and no manual endpoints provided for ${provider.id}`
                        );
                    }

                    throw discoveryError;
                }

                this.configCache.set(cacheKey, config);
                return config;
            }

            // If we have manual endpoints, we handle token exchange manually
            // so we don't need a config object
            throw new Error(`Provider ${provider.id} has manual endpoints, use manual token exchange`);
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

    private getRedirectUri(requestHost?: string): string {
        // If request host is provided and contains localhost, use it
        if (requestHost && requestHost.includes('localhost')) {
            // For local development, we need to use the frontend URL (3000) not the API URL (3001)
            const host = requestHost.replace(':3001', ':3000');
            return `http://${host}/graphql/api/auth/oidc/callback`;
        }

        // Otherwise use the configured base URL
        const baseUrl = this.configService.get('BASE_URL', 'http://tower.local');
        return `${baseUrl}/graphql/api/auth/oidc/callback`;
    }
}
