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
});
