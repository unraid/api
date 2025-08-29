import { Logger } from '@nestjs/common';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { validateRedirectUri } from '@app/unraid-api/utils/redirect-uri-validator.js';

describe('validateRedirectUri', () => {
    let mockLogger: Logger;

    beforeEach(() => {
        mockLogger = {
            debug: vi.fn(),
            warn: vi.fn(),
        } as any;
    });

    describe('basic validation', () => {
        it('should return base URL when no redirect URI is provided', () => {
            const result = validateRedirectUri(undefined, 'https', 'example.com', mockLogger);

            expect(result).toEqual({
                isValid: true,
                validatedUri: 'https://example.com',
                reason: 'No redirect URI provided',
            });
        });

        it('should handle missing base URL', () => {
            const result = validateRedirectUri('https://example.com', 'https', undefined, mockLogger);

            expect(result).toEqual({
                isValid: false,
                validatedUri: '',
                reason: 'No base URL available',
            });
        });
    });

    describe('hostname validation', () => {
        it('should accept matching hostname with same port', () => {
            const result = validateRedirectUri(
                'https://example.com:3000',
                'https',
                'example.com:3000',
                mockLogger
            );

            expect(result.isValid).toBe(true);
            expect(result.validatedUri).toBe('https://example.com:3000');
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'Validated redirect_uri: https://example.com:3000'
            );
        });

        it('should accept matching hostname with different ports', () => {
            const result = validateRedirectUri(
                'https://example.com:3001',
                'https',
                'example.com:3000',
                mockLogger
            );

            expect(result.isValid).toBe(true);
            expect(result.validatedUri).toBe('https://example.com:3001');
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'Validated redirect_uri: https://example.com:3001'
            );
        });

        it('should accept matching hostname when expected has no port but provided does', () => {
            const result = validateRedirectUri(
                'https://example.com:3000',
                'https',
                'example.com',
                mockLogger
            );

            expect(result.isValid).toBe(true);
            expect(result.validatedUri).toBe('https://example.com:3000');
        });

        it('should reject different hostnames', () => {
            const result = validateRedirectUri('https://evil.com', 'https', 'example.com', mockLogger);

            expect(result.isValid).toBe(false);
            expect(result.validatedUri).toBe('https://example.com');
            expect(result.reason).toContain('Hostname or protocol mismatch');
            expect(mockLogger.warn).toHaveBeenCalled();
        });

        it('should reject subdomain differences', () => {
            const result = validateRedirectUri(
                'https://sub.example.com',
                'https',
                'example.com',
                mockLogger
            );

            expect(result.isValid).toBe(false);
            expect(result.validatedUri).toBe('https://example.com');
        });

        it('should handle case-insensitive hostname comparison', () => {
            const result = validateRedirectUri(
                'https://EXAMPLE.COM:3000',
                'https',
                'example.com',
                mockLogger
            );

            expect(result.isValid).toBe(true);
            expect(result.validatedUri).toBe('https://EXAMPLE.COM:3000');
        });
    });

    describe('protocol validation', () => {
        it('should reject HTTP when expecting HTTPS (prevent downgrade attacks)', () => {
            const result = validateRedirectUri('http://example.com', 'https', 'example.com', mockLogger);

            expect(result.isValid).toBe(false);
            expect(result.validatedUri).toBe('https://example.com');
            expect(result.reason).toContain('Hostname or protocol mismatch');
        });

        it('should allow HTTPS when expecting HTTP (common with reverse proxies)', () => {
            const result = validateRedirectUri('https://example.com', 'http', 'example.com', mockLogger);

            expect(result.isValid).toBe(true);
            expect(result.validatedUri).toBe('https://example.com');
        });

        it('should accept matching protocols', () => {
            const result = validateRedirectUri('http://example.com', 'http', 'example.com', mockLogger);

            expect(result.isValid).toBe(true);
            expect(result.validatedUri).toBe('http://example.com');
        });
    });

    describe('malformed URL handling', () => {
        it('should reject invalid URL format', () => {
            const result = validateRedirectUri('not-a-valid-url', 'https', 'example.com', mockLogger);

            expect(result.isValid).toBe(false);
            expect(result.validatedUri).toBe('https://example.com');
            expect(result.reason).toContain('Invalid redirect_uri format');
            expect(mockLogger.warn).toHaveBeenCalledWith('Invalid redirect_uri format: not-a-valid-url');
        });

        it('should reject javascript protocol', () => {
            const result = validateRedirectUri(
                'javascript:alert(1)',
                'https',
                'example.com',
                mockLogger
            );

            expect(result.isValid).toBe(false);
            expect(result.validatedUri).toBe('https://example.com');
        });

        it('should handle URLs with paths and query params', () => {
            const result = validateRedirectUri(
                'https://example.com:3000/callback?foo=bar',
                'https',
                'example.com',
                mockLogger
            );

            expect(result.isValid).toBe(true);
            expect(result.validatedUri).toBe('https://example.com:3000/callback?foo=bar');
        });
    });

    describe('security scenarios', () => {
        it('should prevent open redirect to attacker domain', () => {
            const result = validateRedirectUri(
                'https://attacker.com/steal-token',
                'https',
                'legitimate.com',
                mockLogger
            );

            expect(result.isValid).toBe(false);
            expect(result.validatedUri).toBe('https://legitimate.com');
        });

        it('should prevent homograph attacks with similar looking domains', () => {
            const result = validateRedirectUri(
                'https://examp1e.com', // with number 1 instead of letter l
                'https',
                'example.com',
                mockLogger
            );

            expect(result.isValid).toBe(false);
            expect(result.validatedUri).toBe('https://example.com');
        });

        it('should handle localhost variations correctly', () => {
            const result = validateRedirectUri(
                'http://localhost:3001',
                'http',
                'localhost:3000',
                mockLogger
            );

            expect(result.isValid).toBe(true);
            expect(result.validatedUri).toBe('http://localhost:3001');
        });

        it('should handle IP addresses correctly', () => {
            const result = validateRedirectUri(
                'http://192.168.1.100:3001',
                'http',
                '192.168.1.100:3000',
                mockLogger
            );

            expect(result.isValid).toBe(true);
            expect(result.validatedUri).toBe('http://192.168.1.100:3001');
        });

        it('should reject IP when expecting domain', () => {
            const result = validateRedirectUri(
                'https://192.168.1.100',
                'https',
                'example.com',
                mockLogger
            );

            expect(result.isValid).toBe(false);
            expect(result.validatedUri).toBe('https://example.com');
        });
    });

    describe('allowed origins validation', () => {
        it('should accept redirect URI with different hostname if in allowed origins', () => {
            const result = validateRedirectUri(
                'https://devgen-bad-dev1.local/graphql/api/auth/oidc/callback',
                'http',
                'devgen-dev1.local',
                mockLogger,
                ['https://devgen-bad-dev1.local']
            );

            expect(result.isValid).toBe(true);
            expect(result.validatedUri).toBe(
                'https://devgen-bad-dev1.local/graphql/api/auth/oidc/callback'
            );
        });

        it('should reject redirect URI with hostname not in allowed origins', () => {
            const result = validateRedirectUri(
                'https://evil.com/callback',
                'http',
                'devgen-dev1.local',
                mockLogger,
                ['https://devgen-bad-dev1.local', 'https://another-allowed.local']
            );

            expect(result.isValid).toBe(false);
            expect(result.reason).toContain('Hostname or protocol mismatch');
        });

        it('should handle multiple allowed origins', () => {
            const result = validateRedirectUri(
                'https://second-allowed.local/callback',
                'http',
                'devgen-dev1.local',
                mockLogger,
                [
                    'https://first-allowed.local',
                    'https://second-allowed.local',
                    'https://third-allowed.local',
                ]
            );

            expect(result.isValid).toBe(true);
            expect(result.validatedUri).toBe('https://second-allowed.local/callback');
        });

        it('should allow HTTPS upgrade for allowed origins', () => {
            const result = validateRedirectUri(
                'https://allowed-host.local/callback',
                'http',
                'devgen-dev1.local',
                mockLogger,
                ['http://allowed-host.local']
            );

            expect(result.isValid).toBe(true);
            expect(result.validatedUri).toBe('https://allowed-host.local/callback');
        });

        it('should validate extra hostname from config with proper logging', () => {
            // Simulate a config with an extra hostname like "unraid.local"
            const allowedOriginsFromConfig = ['https://unraid.local:8443'];

            const result = validateRedirectUri(
                'https://unraid.local:8443/graphql/api/auth/oidc/callback',
                'http', // Expected from headers
                'devgen-dev1.local', // Primary hostname
                mockLogger,
                allowedOriginsFromConfig
            );

            // This should pass if the extra hostname is configured correctly
            expect(result.isValid).toBe(true);
            expect(result.validatedUri).toBe('https://unraid.local:8443/graphql/api/auth/oidc/callback');

            // Verify that debug logging shows the check
            expect(mockLogger.debug).toHaveBeenCalledWith('Checking against 1 allowed origins');
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'Checking allowed origin: https://unraid.local:8443'
            );
            expect(mockLogger.debug).toHaveBeenCalledWith(
                '  Origin match: https://unraid.local:8443 matches https://unraid.local:8443'
            );
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'Validated redirect_uri against allowed origin: https://unraid.local:8443/graphql/api/auth/oidc/callback'
            );
        });

        it('should fail validation when extra hostname is not in config', () => {
            // Config has no extra hostnames
            const allowedOriginsFromConfig: string[] = [];

            const result = validateRedirectUri(
                'https://unraid.local:8443/graphql/api/auth/oidc/callback',
                'http',
                'devgen-dev1.local',
                mockLogger,
                allowedOriginsFromConfig
            );

            // This should fail since unraid.local is not in allowed origins
            expect(result.isValid).toBe(false);
            expect(result.validatedUri).toBe('http://devgen-dev1.local');
            expect(result.reason).toContain('Hostname or protocol mismatch');

            // Verify error logging
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Hostname or protocol mismatch')
            );
        });

        describe('enhanced matching modes', () => {
            it('should validate URL prefix match', () => {
                const allowedOriginsFromConfig = ['https://unraid.local:8443/graphql/api/auth/oidc/'];

                const result = validateRedirectUri(
                    'https://unraid.local:8443/graphql/api/auth/oidc/callback?code=123',
                    'http',
                    'devgen-dev1.local',
                    mockLogger,
                    allowedOriginsFromConfig
                );

                expect(result.isValid).toBe(true);
                expect(result.validatedUri).toBe(
                    'https://unraid.local:8443/graphql/api/auth/oidc/callback?code=123'
                );
                expect(mockLogger.debug).toHaveBeenCalledWith(
                    '  URL prefix match: https://unraid.local:8443/graphql/api/auth/oidc/callback?code=123 matches prefix https://unraid.local:8443/graphql/api/auth/oidc/'
                );
            });

            it('should validate origin match (protocol + hostname + port)', () => {
                const allowedOriginsFromConfig = ['https://unraid.local:8443'];

                const result = validateRedirectUri(
                    'https://unraid.local:8443/graphql/api/auth/oidc/callback',
                    'http',
                    'devgen-dev1.local',
                    mockLogger,
                    allowedOriginsFromConfig
                );

                expect(result.isValid).toBe(true);
                expect(result.validatedUri).toBe(
                    'https://unraid.local:8443/graphql/api/auth/oidc/callback'
                );
                expect(mockLogger.debug).toHaveBeenCalledWith(
                    '  Origin match: https://unraid.local:8443 matches https://unraid.local:8443'
                );
            });

            it('should validate hostname-only match (original behavior)', () => {
                const allowedOriginsFromConfig = ['https://unraid.local'];

                const result = validateRedirectUri(
                    'https://unraid.local:8443/graphql/api/auth/oidc/callback',
                    'http',
                    'devgen-dev1.local',
                    mockLogger,
                    allowedOriginsFromConfig
                );

                expect(result.isValid).toBe(true);
                expect(result.validatedUri).toBe(
                    'https://unraid.local:8443/graphql/api/auth/oidc/callback'
                );
                expect(mockLogger.debug).toHaveBeenCalledWith(
                    '  Hostname comparison: provided=unraid.local, allowed=unraid.local'
                );
            });

            it('should prefer exact URL match over origin match', () => {
                const allowedOriginsFromConfig = [
                    'https://unraid.local:8443/graphql/api/auth/oidc/callback', // Exact match first
                    'https://unraid.local:8443', // Origin match second
                ];

                const result = validateRedirectUri(
                    'https://unraid.local:8443/graphql/api/auth/oidc/callback',
                    'http',
                    'devgen-dev1.local',
                    mockLogger,
                    allowedOriginsFromConfig
                );

                expect(result.isValid).toBe(true);
                // Should match the first item in the array due to order of specificity
                expect(mockLogger.debug).toHaveBeenCalledWith(
                    '  Exact URL match: https://unraid.local:8443/graphql/api/auth/oidc/callback matches https://unraid.local:8443/graphql/api/auth/oidc/callback'
                );
            });

            it('should prefer origin match over hostname match', () => {
                const allowedOriginsFromConfig = [
                    'https://unraid.local:8443', // Origin match first
                    'https://unraid.local', // Hostname match second
                ];

                const result = validateRedirectUri(
                    'https://unraid.local:8443/graphql/api/auth/oidc/callback',
                    'http',
                    'devgen-dev1.local',
                    mockLogger,
                    allowedOriginsFromConfig
                );

                expect(result.isValid).toBe(true);
                expect(mockLogger.debug).toHaveBeenCalledWith(
                    '  Origin match: https://unraid.local:8443 matches https://unraid.local:8443'
                );
            });

            it('should handle protocol upgrades for all matching modes', () => {
                const allowedOriginsFromConfig = [
                    'http://unraid.local:8443/graphql/api/auth/oidc/callback',
                    'http://unraid.local:8443',
                    'http://unraid.local',
                ];

                // Test exact URL with protocol upgrade
                const result1 = validateRedirectUri(
                    'https://unraid.local:8443/graphql/api/auth/oidc/callback',
                    'http',
                    'devgen-dev1.local',
                    mockLogger,
                    allowedOriginsFromConfig
                );
                expect(result1.isValid).toBe(true);

                // Test origin with protocol upgrade
                const result2 = validateRedirectUri(
                    'https://unraid.local:8443/different/path',
                    'http',
                    'devgen-dev1.local',
                    mockLogger,
                    allowedOriginsFromConfig
                );
                expect(result2.isValid).toBe(true);

                // Test hostname with protocol upgrade
                const result3 = validateRedirectUri(
                    'https://unraid.local:9443/different/path',
                    'http',
                    'devgen-dev1.local',
                    mockLogger,
                    allowedOriginsFromConfig
                );
                expect(result3.isValid).toBe(true);
            });

            it('should handle invalid allowed origin formats gracefully', () => {
                const allowedOriginsFromConfig = ['not-a-valid-url', 'https://valid.url'];

                const result = validateRedirectUri(
                    'https://valid.url/graphql/api/auth/oidc/callback',
                    'http',
                    'devgen-dev1.local',
                    mockLogger,
                    allowedOriginsFromConfig
                );

                expect(result.isValid).toBe(true);
                expect(mockLogger.warn).toHaveBeenCalledWith(
                    'Invalid allowed origin format: not-a-valid-url'
                );
            });
        });
    });
});
