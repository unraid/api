import { describe, expect, it, vi } from 'vitest';

import { ErrorExtractor } from '@app/unraid-api/utils/error-extractor.util.js';

describe('ErrorExtractor', () => {
    describe('extract', () => {
        it('should handle null and undefined errors', () => {
            const nullResult = ErrorExtractor.extract(null);
            expect(nullResult.message).toBe('Unknown error');
            expect(nullResult.type).toBe('Unknown');

            const undefinedResult = ErrorExtractor.extract(undefined);
            expect(undefinedResult.message).toBe('Unknown error');
            expect(undefinedResult.type).toBe('Unknown');
        });

        it('should extract basic Error properties', () => {
            const error = new Error('Test error message');
            const result = ErrorExtractor.extract(error);

            expect(result.message).toBe('Test error message');
            expect(result.type).toBe('Error');
            expect(result.stack).toBeDefined();
        });

        it('should extract custom error types', () => {
            class CustomError extends Error {}
            const error = new CustomError('Custom error');
            const result = ErrorExtractor.extract(error);

            expect(result.type).toBe('CustomError');
        });

        it('should extract error code', () => {
            const error: any = new Error('Error with code');
            error.code = 'ERR_CODE';
            const result = ErrorExtractor.extract(error);

            expect(result.code).toBe('ERR_CODE');
        });

        it('should extract HTTP response details', () => {
            const error: any = new Error('HTTP error');
            error.response = {
                status: 404,
                statusText: 'Not Found',
                body: { error: 'Resource not found' },
                headers: { 'content-type': 'application/json' },
            };

            const result = ErrorExtractor.extract(error);

            expect(result.status).toBe(404);
            expect(result.statusText).toBe('Not Found');
            expect(result.responseBody).toEqual({ error: 'Resource not found' });
            expect(result.responseHeaders).toEqual({ 'content-type': 'application/json' });
        });

        it('should truncate long response body strings', () => {
            const error: any = new Error('Error with long body');
            const longString = 'x'.repeat(2000);
            error.body = longString;

            const result = ErrorExtractor.extract(error);

            expect(result.responseBody).toBe('x'.repeat(1000) + '... (truncated)');
        });

        it('should extract OAuth error details', () => {
            const error: any = new Error('OAuth error');
            error.error = 'invalid_grant';
            error.error_description = 'The provided authorization code is invalid';

            const result = ErrorExtractor.extract(error);

            expect(result.oauthError).toBe('invalid_grant');
            expect(result.oauthErrorDescription).toBe('The provided authorization code is invalid');
        });

        it('should extract cause chain', () => {
            const rootCause = new Error('Root cause');
            const middleCause: any = new Error('Middle cause');
            middleCause.cause = rootCause;
            const topError: any = new Error('Top error');
            topError.cause = middleCause;

            const result = ErrorExtractor.extract(topError);

            expect(result.causeChain).toHaveLength(2);
            expect(result.causeChain![0]).toEqual({
                depth: 1,
                type: 'Error',
                message: 'Middle cause',
            });
            expect(result.causeChain![1]).toEqual({
                depth: 2,
                type: 'Error',
                message: 'Root cause',
            });
        });

        it('should limit cause chain depth', () => {
            // Create a deep nested error chain
            let deepestError: any = new Error('Level 10');

            for (let i = 9; i >= 0; i--) {
                const error: any = new Error(`Level ${i}`);
                error.cause = deepestError;
                deepestError = error;
            }

            const topError: any = new Error('Top');
            topError.cause = deepestError;

            const result = ErrorExtractor.extract(topError);

            expect(result.causeChain).toHaveLength(5); // MAX_CAUSE_DEPTH
        });

        it('should extract cause with code', () => {
            const cause: any = new Error('Cause with code');
            cause.code = 'ECONNREFUSED';
            const error: any = new Error('Main error');
            error.cause = cause;

            const result = ErrorExtractor.extract(error);

            expect(result.causeChain![0].code).toBe('ECONNREFUSED');
        });

        it('should extract additional properties', () => {
            const error: any = new Error('Error with extras');
            error.customProp1 = 'value1';
            error.customProp2 = 123;

            const result = ErrorExtractor.extract(error);

            expect(result.additionalProperties).toEqual({
                customProp1: 'value1',
                customProp2: 123,
            });
        });

        it('should handle string errors', () => {
            const result = ErrorExtractor.extract('String error message');

            expect(result.message).toBe('String error message');
            expect(result.type).toBe('String');
        });

        it('should handle object errors', () => {
            const error = { code: 'ERROR', message: 'Object error' };
            const result = ErrorExtractor.extract(error);

            expect(result.message).toBe(JSON.stringify(error));
            expect(result.type).toBe('Object');
        });

        it('should handle primitive errors', () => {
            const result = ErrorExtractor.extract(42);

            expect(result.message).toBe('42');
            expect(result.type).toBe('number');
        });

        it('should handle openid-client error structure', () => {
            const error: any = new Error('unexpected response content-type');
            error.code = 'OAUTH_RESPONSE_IS_NOT_JSON';
            error.response = {
                status: 200,
                headers: { 'content-type': 'text/html' },
                body: '<html>Error page</html>',
            };

            const result = ErrorExtractor.extract(error);

            expect(result.code).toBe('OAUTH_RESPONSE_IS_NOT_JSON');
            expect(result.responseHeaders!['content-type']).toBe('text/html');
            expect(result.responseBody).toContain('<html>');
        });
    });

    describe('isOAuthResponseError', () => {
        it('should identify OAuth response errors by code', () => {
            const extracted = {
                message: 'Some error',
                type: 'Error',
                code: 'OAUTH_RESPONSE_IS_NOT_JSON',
            };

            expect(ErrorExtractor.isOAuthResponseError(extracted)).toBe(true);
        });

        it('should identify OAuth response errors by message', () => {
            const extracted = {
                message: 'unexpected response content-type from server',
                type: 'Error',
            };

            expect(ErrorExtractor.isOAuthResponseError(extracted)).toBe(true);
        });

        it('should identify parsing errors', () => {
            const extracted = {
                message: 'JSON parsing error occurred',
                type: 'Error',
            };

            expect(ErrorExtractor.isOAuthResponseError(extracted)).toBe(true);
        });

        it('should not identify non-OAuth errors', () => {
            const extracted = {
                message: 'Some other error',
                type: 'Error',
                code: 'OTHER_ERROR',
            };

            expect(ErrorExtractor.isOAuthResponseError(extracted)).toBe(false);
        });
    });

    describe('isJwtClaimError', () => {
        it('should identify JWT claim errors', () => {
            const extracted = {
                message: 'unexpected JWT claim value encountered',
                type: 'Error',
            };

            expect(ErrorExtractor.isJwtClaimError(extracted)).toBe(true);
        });

        it('should not identify non-JWT errors', () => {
            const extracted = {
                message: 'Some other error',
                type: 'Error',
            };

            expect(ErrorExtractor.isJwtClaimError(extracted)).toBe(false);
        });
    });

    describe('isNetworkError', () => {
        it('should identify network errors by code', () => {
            const codes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'];

            for (const code of codes) {
                const extracted = {
                    message: 'Error',
                    type: 'Error',
                    code,
                };

                expect(ErrorExtractor.isNetworkError(extracted)).toBe(true);
            }
        });

        it('should identify network errors by message', () => {
            const messages = ['network timeout occurred', 'failed to connect to server'];

            for (const message of messages) {
                const extracted = {
                    message,
                    type: 'Error',
                };

                expect(ErrorExtractor.isNetworkError(extracted)).toBe(true);
            }
        });

        it('should not identify non-network errors', () => {
            const extracted = {
                message: 'Invalid credentials',
                type: 'Error',
                code: 'AUTH_ERROR',
            };

            expect(ErrorExtractor.isNetworkError(extracted)).toBe(false);
        });
    });

    describe('formatForLogging', () => {
        it('should log basic error information', () => {
            const logger = {
                error: vi.fn(),
                debug: vi.fn(),
            };

            const extracted = {
                message: 'Test error',
                type: 'CustomError',
                code: 'ERR_TEST',
            };

            ErrorExtractor.formatForLogging(extracted, logger);

            expect(logger.error).toHaveBeenCalledWith('Error type: CustomError');
            expect(logger.error).toHaveBeenCalledWith('Error message: Test error');
            expect(logger.error).toHaveBeenCalledWith('Error code: ERR_TEST');
        });

        it('should log HTTP response details', () => {
            const logger = {
                error: vi.fn(),
                debug: vi.fn(),
            };

            const extracted = {
                message: 'HTTP error',
                type: 'Error',
                status: 500,
                statusText: 'Internal Server Error',
                responseBody: { error: 'Server error' },
                responseHeaders: { 'content-type': 'application/json' },
            };

            ErrorExtractor.formatForLogging(extracted, logger);

            expect(logger.error).toHaveBeenCalledWith('HTTP Status: 500 Internal Server Error');
            expect(logger.error).toHaveBeenCalledWith('Response body: %o', { error: 'Server error' });
            expect(logger.error).toHaveBeenCalledWith('Response Content-Type: application/json');
        });

        it('should log OAuth error details', () => {
            const logger = {
                error: vi.fn(),
                debug: vi.fn(),
            };

            const extracted = {
                message: 'OAuth error',
                type: 'Error',
                oauthError: 'invalid_client',
                oauthErrorDescription: 'Client authentication failed',
            };

            ErrorExtractor.formatForLogging(extracted, logger);

            expect(logger.error).toHaveBeenCalledWith('OAuth error: invalid_client');
            expect(logger.error).toHaveBeenCalledWith(
                'OAuth error description: Client authentication failed'
            );
        });

        it('should log cause chain', () => {
            const logger = {
                error: vi.fn(),
                debug: vi.fn(),
            };

            const extracted = {
                message: 'Top error',
                type: 'Error',
                causeChain: [
                    { depth: 1, type: 'Error', message: 'Cause 1', code: 'CODE1' },
                    { depth: 2, type: 'Error', message: 'Cause 2' },
                ],
            };

            ErrorExtractor.formatForLogging(extracted, logger);

            expect(logger.error).toHaveBeenCalledWith('Error cause chain:');
            expect(logger.error).toHaveBeenCalledWith('  [Cause 1] Error: Cause 1');
            expect(logger.error).toHaveBeenCalledWith('  [Cause 1] Code: CODE1');
            expect(logger.error).toHaveBeenCalledWith('  [Cause 2] Error: Cause 2');
        });

        it('should log additional properties and stack in debug', () => {
            const logger = {
                error: vi.fn(),
                debug: vi.fn(),
            };

            const extracted = {
                message: 'Error',
                type: 'Error',
                additionalProperties: { custom: 'value' },
                stack: 'Stack trace here',
            };

            ErrorExtractor.formatForLogging(extracted, logger);

            expect(logger.debug).toHaveBeenCalledWith('Additional error properties: %o', {
                custom: 'value',
            });
            expect(logger.debug).toHaveBeenCalledWith('Stack trace: Stack trace here');
        });

        it('should handle case-insensitive Content-Type header', () => {
            const logger = {
                error: vi.fn(),
                debug: vi.fn(),
            };

            const extracted = {
                message: 'Error',
                type: 'Error',
                responseHeaders: { 'Content-Type': 'text/html' },
            };

            ErrorExtractor.formatForLogging(extracted, logger);

            expect(logger.error).toHaveBeenCalledWith('Response Content-Type: text/html');
        });
    });
});
