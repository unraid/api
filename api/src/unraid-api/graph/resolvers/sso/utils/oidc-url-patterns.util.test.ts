import { describe, expect, it } from 'vitest';

import { OidcUrlPatterns } from '@app/unraid-api/graph/resolvers/sso/utils/oidc-url-patterns.util.js';

describe('OidcUrlPatterns', () => {
    describe('ISSUER_URL_PATTERN', () => {
        it('should be defined as a string', () => {
            expect(typeof OidcUrlPatterns.ISSUER_URL_PATTERN).toBe('string');
            expect(OidcUrlPatterns.ISSUER_URL_PATTERN).toBe('^https?://[^/\\s]+(?:/[^/\\s]*)*[^/\\s]$');
        });
    });

    describe('ISSUER_URL_REGEX', () => {
        it('should be a RegExp instance', () => {
            expect(OidcUrlPatterns.ISSUER_URL_REGEX).toBeInstanceOf(RegExp);
        });

        it('should match the pattern string', () => {
            const regex = new RegExp(OidcUrlPatterns.ISSUER_URL_PATTERN);
            expect(OidcUrlPatterns.ISSUER_URL_REGEX.source).toBe(regex.source);
        });
    });

    describe('isValidIssuerUrl', () => {
        it('should accept valid URLs without trailing slash', () => {
            const validUrls = [
                'https://accounts.google.com',
                'https://auth.example.com/oidc',
                'https://auth.example.com/realms/master',
                'http://localhost:8080',
                'http://localhost:8080/auth',
                'https://login.microsoftonline.com/common/v2.0',
            ];

            validUrls.forEach((url) => {
                expect(OidcUrlPatterns.isValidIssuerUrl(url)).toBe(true);
            });
        });

        it('should reject URLs with trailing slashes', () => {
            const invalidUrls = [
                'https://accounts.google.com/',
                'https://auth.example.com/oidc/',
                'https://auth.example.com/realms/master/',
                'http://localhost:8080/',
                'http://localhost:8080/auth/',
                'https://login.microsoftonline.com/common/v2.0/',
            ];

            invalidUrls.forEach((url) => {
                expect(OidcUrlPatterns.isValidIssuerUrl(url)).toBe(false);
            });
        });

        it('should reject URLs with whitespace', () => {
            const invalidUrls = [
                'https://accounts.google.com ',
                ' https://accounts.google.com',
                'https://accounts. google.com',
                'https://accounts.google.com\t',
                'https://accounts.google.com\n',
            ];

            invalidUrls.forEach((url) => {
                expect(OidcUrlPatterns.isValidIssuerUrl(url)).toBe(false);
            });
        });

        it('should accept both HTTP and HTTPS protocols', () => {
            expect(OidcUrlPatterns.isValidIssuerUrl('https://example.com')).toBe(true);
            expect(OidcUrlPatterns.isValidIssuerUrl('http://example.com')).toBe(true);
        });

        it('should reject other protocols', () => {
            expect(OidcUrlPatterns.isValidIssuerUrl('ftp://example.com')).toBe(false);
            expect(OidcUrlPatterns.isValidIssuerUrl('ws://example.com')).toBe(false);
            expect(OidcUrlPatterns.isValidIssuerUrl('file://example.com')).toBe(false);
        });

        it('should accept .well-known URLs without trailing slashes', () => {
            const wellKnownUrls = [
                'https://example.com/.well-known/openid-configuration',
                'https://auth.example.com/path/.well-known/openid-configuration',
                'https://example.com/.well-known/jwks.json',
                'https://keycloak.example.com/realms/master/.well-known/openid-configuration',
            ];

            wellKnownUrls.forEach((url) => {
                expect(OidcUrlPatterns.isValidIssuerUrl(url)).toBe(true);
            });
        });

        it('should reject .well-known URLs with trailing slashes', () => {
            const invalidWellKnownUrls = [
                'https://example.com/.well-known/openid-configuration/',
                'https://auth.example.com/path/.well-known/openid-configuration/',
                'https://example.com/.well-known/jwks.json/',
                'https://keycloak.example.com/realms/master/.well-known/openid-configuration/',
            ];

            invalidWellKnownUrls.forEach((url) => {
                expect(OidcUrlPatterns.isValidIssuerUrl(url)).toBe(false);
            });
        });

        it('should handle complex real-world scenarios', () => {
            // Google
            expect(OidcUrlPatterns.isValidIssuerUrl('https://accounts.google.com')).toBe(true);
            expect(OidcUrlPatterns.isValidIssuerUrl('https://accounts.google.com/')).toBe(false);

            // Microsoft
            expect(
                OidcUrlPatterns.isValidIssuerUrl('https://login.microsoftonline.com/tenant-id/v2.0')
            ).toBe(true);
            expect(
                OidcUrlPatterns.isValidIssuerUrl('https://login.microsoftonline.com/tenant-id/v2.0/')
            ).toBe(false);

            // Auth0
            expect(OidcUrlPatterns.isValidIssuerUrl('https://tenant.auth0.com')).toBe(true);
            expect(OidcUrlPatterns.isValidIssuerUrl('https://tenant.auth0.com/')).toBe(false);

            // Keycloak
            expect(OidcUrlPatterns.isValidIssuerUrl('https://keycloak.example.com/realms/master')).toBe(
                true
            );
            expect(OidcUrlPatterns.isValidIssuerUrl('https://keycloak.example.com/realms/master/')).toBe(
                false
            );

            // AWS Cognito
            expect(
                OidcUrlPatterns.isValidIssuerUrl(
                    'https://cognito-idp.us-west-2.amazonaws.com/us-west-2_example'
                )
            ).toBe(true);
            expect(
                OidcUrlPatterns.isValidIssuerUrl(
                    'https://cognito-idp.us-west-2.amazonaws.com/us-west-2_example/'
                )
            ).toBe(false);
        });
    });

    describe('getExamples', () => {
        it('should return valid and invalid URL examples', () => {
            const examples = OidcUrlPatterns.getExamples();

            expect(examples).toHaveProperty('valid');
            expect(examples).toHaveProperty('invalid');
            expect(Array.isArray(examples.valid)).toBe(true);
            expect(Array.isArray(examples.invalid)).toBe(true);
            expect(examples.valid.length).toBeGreaterThan(0);
            expect(examples.invalid.length).toBeGreaterThan(0);
        });

        it('should have all valid examples pass validation', () => {
            const examples = OidcUrlPatterns.getExamples();

            examples.valid.forEach((url) => {
                expect(OidcUrlPatterns.isValidIssuerUrl(url)).toBe(true);
            });
        });

        it('should have all invalid examples fail validation', () => {
            const examples = OidcUrlPatterns.getExamples();

            examples.invalid.forEach((url) => {
                expect(OidcUrlPatterns.isValidIssuerUrl(url)).toBe(false);
            });
        });
    });

    describe('integration with the bug report scenario', () => {
        it('should specifically catch the Google trailing slash issue from the bug report', () => {
            // The exact scenario from the bug report
            const problematicUrl = 'https://accounts.google.com/';
            const correctUrl = 'https://accounts.google.com';

            expect(OidcUrlPatterns.isValidIssuerUrl(problematicUrl)).toBe(false);
            expect(OidcUrlPatterns.isValidIssuerUrl(correctUrl)).toBe(true);
        });

        it('should prevent the double slash in discovery URL construction', () => {
            // Simulate what would happen in discovery URL construction
            const issuerWithSlash = 'https://accounts.google.com/';
            const issuerWithoutSlash = 'https://accounts.google.com';

            // This is what would happen in the discovery process
            const discoveryWithSlash = `${issuerWithSlash}/.well-known/openid-configuration`;
            const discoveryWithoutSlash = `${issuerWithoutSlash}/.well-known/openid-configuration`;

            expect(discoveryWithSlash).toBe(
                'https://accounts.google.com//.well-known/openid-configuration'
            ); // Double slash - bad
            expect(discoveryWithoutSlash).toBe(
                'https://accounts.google.com/.well-known/openid-configuration'
            ); // Single slash - good

            // Our validation should prevent the first scenario
            expect(OidcUrlPatterns.isValidIssuerUrl(issuerWithSlash)).toBe(false);
            expect(OidcUrlPatterns.isValidIssuerUrl(issuerWithoutSlash)).toBe(true);
        });
    });
});
