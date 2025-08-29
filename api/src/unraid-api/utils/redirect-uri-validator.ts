import { Logger } from '@nestjs/common';

export interface RedirectUriValidationResult {
    isValid: boolean;
    validatedUri: string;
    reason?: string;
}

/**
 * Validates a redirect URI against the expected origin from request headers.
 * This is critical for OAuth security to prevent authorization code interception.
 *
 * Security considerations:
 * - Prevents redirecting OAuth codes to external domains
 * - Allows port variations (needed for nginx/socket proxy scenarios)
 * - Validates protocol to prevent downgrade attacks
 * - Optionally validates against additional allowed origins
 *
 * @param redirectUri - The redirect URI provided by the client
 * @param expectedProtocol - The protocol from request headers (http/https)
 * @param expectedHost - The host from request headers (may or may not include port)
 * @param logger - Optional logger for debugging
 * @param allowedOrigins - Optional list of additional allowed origins
 * @returns Validation result with the URI to use
 */
export function validateRedirectUri(
    redirectUri: string | undefined,
    expectedProtocol: string,
    expectedHost: string | undefined,
    logger?: Logger,
    allowedOrigins?: string[]
): RedirectUriValidationResult {
    const baseUrl = expectedHost ? `${expectedProtocol}://${expectedHost}` : undefined;

    // If no redirect URI provided, use the base URL
    if (!redirectUri || !baseUrl) {
        return {
            isValid: !redirectUri,
            validatedUri: baseUrl || '',
            reason: !redirectUri ? 'No redirect URI provided' : 'No base URL available',
        };
    }

    try {
        // Parse both URLs to validate hostname
        const providedUrl = new URL(redirectUri);
        const expectedUrl = new URL(baseUrl);

        // Security: Validate hostname matches, but allow port differences
        // This handles cases where nginx/socket proxy doesn't preserve port info
        const providedHostname = providedUrl.hostname.toLowerCase();
        const expectedHostname = expectedUrl.hostname.toLowerCase();

        // Check protocol matches, but allow HTTPS when expecting HTTP (common with reverse proxies)
        // Never allow HTTP when expecting HTTPS (would be a downgrade attack)
        const protocolMatches =
            providedUrl.protocol === expectedUrl.protocol ||
            (expectedUrl.protocol === 'http:' && providedUrl.protocol === 'https:');
        const hostnameMatches = providedHostname === expectedHostname;

        // Check against primary expected origin
        if (protocolMatches && hostnameMatches) {
            // Trust the redirect_uri with its port information
            logger?.debug(`Validated redirect_uri: ${redirectUri}`);
            return {
                isValid: true,
                validatedUri: redirectUri,
            };
        }

        // Check against additional allowed origins if provided
        if (allowedOrigins && allowedOrigins.length > 0) {
            logger?.debug(`Checking against ${allowedOrigins.length} allowed origins`);
            for (const allowedOrigin of allowedOrigins) {
                try {
                    const allowedUrl = new URL(allowedOrigin);
                    const allowedOriginStr = allowedUrl.origin.toLowerCase();
                    const allowedHostname = allowedUrl.hostname.toLowerCase();

                    logger?.debug(`Checking allowed origin: ${allowedOrigin}`);

                    // Try multiple matching strategies in order of specificity

                    // 1. Exact URL match (if allowed origin includes path/query)
                    if (allowedOrigin.includes('/') && allowedOrigin.length > allowedOriginStr.length) {
                        const allowedUrlNormalized = allowedOrigin.toLowerCase();
                        const providedUrlNormalized = redirectUri.toLowerCase();

                        // Exact match
                        if (providedUrlNormalized === allowedUrlNormalized) {
                            logger?.debug(`  Exact URL match: ${redirectUri} matches ${allowedOrigin}`);
                            logger?.debug(
                                `Validated redirect_uri against allowed origin: ${redirectUri}`
                            );
                            return {
                                isValid: true,
                                validatedUri: redirectUri,
                            };
                        }

                        // Prefix match (if allowed origin ends with /)
                        if (
                            allowedUrlNormalized.endsWith('/') &&
                            providedUrlNormalized.startsWith(allowedUrlNormalized)
                        ) {
                            logger?.debug(
                                `  URL prefix match: ${redirectUri} matches prefix ${allowedOrigin}`
                            );
                            logger?.debug(
                                `Validated redirect_uri against allowed origin: ${redirectUri}`
                            );
                            return {
                                isValid: true,
                                validatedUri: redirectUri,
                            };
                        }
                    }

                    // 2. Origin match (protocol + hostname + port)
                    const providedOrigin = providedUrl.origin.toLowerCase();
                    if (providedOrigin === allowedOriginStr) {
                        // Allow HTTPS when expecting HTTP (common with reverse proxies)
                        const originProtocolMatches =
                            providedUrl.protocol === allowedUrl.protocol ||
                            (allowedUrl.protocol === 'http:' && providedUrl.protocol === 'https:');

                        if (originProtocolMatches) {
                            logger?.debug(
                                `  Origin match: ${providedOrigin} matches ${allowedOriginStr}`
                            );
                            logger?.debug(
                                `Validated redirect_uri against allowed origin: ${redirectUri}`
                            );
                            return {
                                isValid: true,
                                validatedUri: redirectUri,
                            };
                        }
                    }

                    // 3. Hostname match (original behavior, but with better logging)
                    const allowedProtocolMatches =
                        providedUrl.protocol === allowedUrl.protocol ||
                        (allowedUrl.protocol === 'http:' && providedUrl.protocol === 'https:');
                    const allowedHostnameMatches = providedHostname === allowedHostname;

                    logger?.debug(
                        `  Hostname comparison: provided=${providedHostname}, allowed=${allowedHostname}`
                    );
                    logger?.debug(
                        `  Protocol comparison: provided=${providedUrl.protocol}, allowed=${allowedUrl.protocol}`
                    );
                    logger?.debug(
                        `  Protocol matches: ${allowedProtocolMatches}, Hostname matches: ${allowedHostnameMatches}`
                    );

                    if (allowedProtocolMatches && allowedHostnameMatches) {
                        logger?.debug(`Validated redirect_uri against allowed origin: ${redirectUri}`);
                        return {
                            isValid: true,
                            validatedUri: redirectUri,
                        };
                    }
                } catch (e) {
                    logger?.warn(`Invalid allowed origin format: ${allowedOrigin}`);
                }
            }
        }

        // If we get here, validation failed
        const reason = `Hostname or protocol mismatch. Expected: ${expectedUrl.protocol}//${expectedHostname}, Got: ${providedUrl.protocol}//${providedHostname}`;
        logger?.warn(`Rejected redirect_uri: ${reason}`);
        return {
            isValid: false,
            validatedUri: baseUrl,
            reason,
        };
    } catch (error) {
        const reason = `Invalid redirect_uri format: ${redirectUri}`;
        logger?.warn(reason);
        return {
            isValid: false,
            validatedUri: baseUrl,
            reason,
        };
    }
}
