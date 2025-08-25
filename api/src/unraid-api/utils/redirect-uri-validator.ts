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
 *
 * @param redirectUri - The redirect URI provided by the client
 * @param expectedProtocol - The protocol from request headers (http/https)
 * @param expectedHost - The host from request headers (may or may not include port)
 * @param logger - Optional logger for debugging
 * @returns Validation result with the URI to use
 */
export function validateRedirectUri(
    redirectUri: string | undefined,
    expectedProtocol: string,
    expectedHost: string | undefined,
    logger?: Logger
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

        // Also ensure protocol matches for security
        const protocolMatches = providedUrl.protocol === expectedUrl.protocol;
        const hostnameMatches = providedHostname === expectedHostname;

        if (protocolMatches && hostnameMatches) {
            // Trust the redirect_uri with its port information
            logger?.debug(`Validated redirect_uri: ${redirectUri}`);
            return {
                isValid: true,
                validatedUri: redirectUri,
            };
        } else {
            const reason = `Hostname or protocol mismatch. Expected: ${expectedUrl.protocol}//${expectedHostname}, Got: ${providedUrl.protocol}//${providedHostname}`;
            logger?.warn(`Rejected redirect_uri: ${reason}`);
            return {
                isValid: false,
                validatedUri: baseUrl,
                reason,
            };
        }
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
