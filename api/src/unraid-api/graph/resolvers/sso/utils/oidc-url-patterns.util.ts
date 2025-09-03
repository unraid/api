/**
 * Utility for OIDC URL validation patterns
 */
export class OidcUrlPatterns {
    /**
     * Regex pattern for validating OIDC issuer URLs
     * - Allows HTTP and HTTPS protocols
     * - Prevents trailing slashes
     * - Prevents whitespace
     * - Allows paths but not ending with slash
     */
    static readonly ISSUER_URL_PATTERN = '^https?://[^/\\s]+(?:/[^/\\s]*)*[^/\\s]$';

    /**
     * Compiled regex for issuer URL validation
     */
    static readonly ISSUER_URL_REGEX = new RegExp(OidcUrlPatterns.ISSUER_URL_PATTERN);

    /**
     * Validate an issuer URL against the pattern
     * @param url The URL to validate
     * @returns True if the URL is valid, false otherwise
     */
    static isValidIssuerUrl(url: string): boolean {
        return this.ISSUER_URL_REGEX.test(url);
    }

    /**
     * Get examples of valid and invalid issuer URLs for documentation/testing
     */
    static getExamples() {
        return {
            valid: [
                // Standard issuer URLs (most common)
                'https://accounts.google.com',
                'https://auth.example.com/oidc',
                'https://auth.example.com/realms/master',
                'http://localhost:8080',
                'http://localhost:8080/auth',
                'https://login.microsoftonline.com/common/v2.0',
                'https://cognito-idp.us-west-2.amazonaws.com/us-west-2_example',
                // Well-known URLs are valid at the URL pattern level (schema-level validation handles rejection)
                'https://example.com/.well-known/openid-configuration',
                'https://auth.example.com/path/.well-known/openid-configuration',
                'https://example.com/.well-known/jwks.json',
            ],
            invalid: [
                'https://accounts.google.com/', // Trailing slash
                'https://auth.example.com/oidc/', // Trailing slash
                'https://auth.example.com/realms/master/', // Trailing slash
                'http://localhost:8080/', // Trailing slash
                'https://accounts.google.com ', // Trailing whitespace
                ' https://accounts.google.com', // Leading whitespace
                'https://accounts. google.com', // Internal whitespace
                'ftp://example.com', // Invalid protocol
            ],
        };
    }
}
