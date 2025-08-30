export interface ExtractedError {
    message: string;
    type: string;
    code?: string;
    status?: number;
    statusText?: string;
    responseBody?: unknown;
    responseHeaders?: Record<string, string>;
    oauthError?: string;
    oauthErrorDescription?: string;
    causeChain?: Array<{
        depth: number;
        type: string;
        message: string;
        code?: string;
    }>;
    additionalProperties?: Record<string, unknown>;
    stack?: string;
}

export class ErrorExtractor {
    private static readonly MAX_CAUSE_DEPTH = 5;
    private static readonly MAX_BODY_PREVIEW_LENGTH = 1000;

    static extract(error: unknown): ExtractedError {
        const result: ExtractedError = {
            message: 'Unknown error',
            type: 'Unknown',
        };

        if (!error) {
            return result;
        }

        if (error instanceof Error) {
            result.message = error.message;
            result.type = error.constructor.name;
            result.stack = error.stack;

            // Extract error code if present
            if ('code' in error && error.code) {
                result.code = String(error.code);
            }

            // Extract HTTP response details
            if ('response' in error && error.response) {
                this.extractResponseDetails(error.response as any, result);
            }

            // Extract OAuth-specific errors
            if ('error' in error && error.error) {
                result.oauthError = String(error.error);
            }

            if ('error_description' in error && error.error_description) {
                result.oauthErrorDescription = String(error.error_description);
            }

            // Extract response body if directly available
            if ('body' in error && error.body) {
                result.responseBody = this.formatResponseBody(error.body as any);
            }

            // Extract cause chain
            if ('cause' in error && error.cause) {
                result.causeChain = this.extractCauseChain(error.cause);
            }

            // Extract additional properties
            const standardKeys = [
                'message',
                'stack',
                'cause',
                'code',
                'response',
                'body',
                'error',
                'error_description',
            ];
            const additionalKeys = Object.keys(error).filter((key) => !standardKeys.includes(key));

            if (additionalKeys.length > 0) {
                result.additionalProperties = {};
                for (const key of additionalKeys) {
                    const value = (error as any)[key];
                    if (value !== undefined && value !== null) {
                        result.additionalProperties[key] = value;
                    }
                }
            }
        } else if (typeof error === 'string') {
            result.message = error;
            result.type = 'String';
        } else if (typeof error === 'object' && error !== null) {
            result.message = JSON.stringify(error);
            result.type = 'Object';
        } else {
            result.message = String(error);
            result.type = typeof error;
        }

        return result;
    }

    private static extractResponseDetails(response: any, result: ExtractedError): void {
        if (!response) return;

        if (response.status) {
            result.status = response.status;
        }

        if (response.statusText) {
            result.statusText = response.statusText;
        }

        if (response.body) {
            result.responseBody = this.formatResponseBody(response.body);
        }

        if (response.headers) {
            result.responseHeaders = this.extractHeaders(response.headers);
        }
    }

    private static formatResponseBody(body: unknown): unknown {
        if (!body) return undefined;

        if (typeof body === 'string') {
            if (body.length > this.MAX_BODY_PREVIEW_LENGTH) {
                return body.substring(0, this.MAX_BODY_PREVIEW_LENGTH) + '... (truncated)';
            }
            return body;
        }

        return body;
    }

    private static extractHeaders(headers: any): Record<string, string> | undefined {
        if (!headers) return undefined;

        const result: Record<string, string> = {};

        // Handle different header formats
        if (typeof headers === 'object') {
            for (const key of Object.keys(headers)) {
                const value = headers[key];
                if (value !== undefined && value !== null) {
                    result[key] = String(value);
                }
            }
        }

        return Object.keys(result).length > 0 ? result : undefined;
    }

    private static extractCauseChain(
        cause: unknown
    ): Array<{ depth: number; type: string; message: string; code?: string }> | undefined {
        const chain: Array<{ depth: number; type: string; message: string; code?: string }> = [];
        let currentCause = cause;
        let depth = 1;

        while (currentCause && depth <= this.MAX_CAUSE_DEPTH) {
            const causeInfo: { depth: number; type: string; message: string; code?: string } = {
                depth,
                type: 'Unknown',
                message: 'Unknown cause',
            };

            if (currentCause instanceof Error) {
                causeInfo.type = currentCause.constructor.name;
                causeInfo.message = currentCause.message;

                if ('code' in currentCause && currentCause.code) {
                    causeInfo.code = String(currentCause.code);
                }
            } else if (typeof currentCause === 'string') {
                causeInfo.type = 'String';
                causeInfo.message = currentCause;
            } else {
                causeInfo.type = typeof currentCause;
                causeInfo.message = String(currentCause);
            }

            chain.push(causeInfo);

            // Get next cause in chain
            currentCause =
                currentCause && typeof currentCause === 'object' && 'cause' in currentCause
                    ? (currentCause as any).cause
                    : undefined;
            depth++;
        }

        return chain.length > 0 ? chain : undefined;
    }

    static isOAuthResponseError(extracted: ExtractedError): boolean {
        return Boolean(
            extracted.code === 'OAUTH_RESPONSE_IS_NOT_JSON' ||
                extracted.code === 'OAUTH_PARSE_ERROR' ||
                extracted.message.includes('unexpected response content-type') ||
                extracted.message.includes('parsing error')
        );
    }

    static isJwtClaimError(extracted: ExtractedError): boolean {
        return extracted.message.includes('unexpected JWT claim value encountered');
    }

    static isNetworkError(extracted: ExtractedError): boolean {
        return Boolean(
            extracted.code === 'ECONNREFUSED' ||
                extracted.code === 'ENOTFOUND' ||
                extracted.code === 'ETIMEDOUT' ||
                extracted.code === 'ECONNRESET' ||
                extracted.message.includes('network') ||
                extracted.message.includes('connect')
        );
    }

    static formatForLogging(
        extracted: ExtractedError,
        logger: {
            error: (msg: string, ...args: any[]) => void;
            debug: (msg: string, ...args: any[]) => void;
        }
    ): void {
        logger.error(`Error type: ${extracted.type}`);
        logger.error(`Error message: ${extracted.message}`);

        if (extracted.code) {
            logger.error(`Error code: ${extracted.code}`);
        }

        if (extracted.status) {
            logger.error(`HTTP Status: ${extracted.status} ${extracted.statusText || ''}`);
        }

        if (extracted.responseBody) {
            logger.error('Response body: %o', extracted.responseBody);
        }

        if (extracted.responseHeaders) {
            const contentType =
                extracted.responseHeaders['content-type'] || extracted.responseHeaders['Content-Type'];
            if (contentType) {
                logger.error(`Response Content-Type: ${contentType}`);
            }
        }

        if (extracted.oauthError) {
            logger.error(`OAuth error: ${extracted.oauthError}`);
            if (extracted.oauthErrorDescription) {
                logger.error(`OAuth error description: ${extracted.oauthErrorDescription}`);
            }
        }

        if (extracted.causeChain) {
            logger.error('Error cause chain:');
            for (const cause of extracted.causeChain) {
                logger.error(`  [Cause ${cause.depth}] ${cause.type}: ${cause.message}`);
                if (cause.code) {
                    logger.error(`  [Cause ${cause.depth}] Code: ${cause.code}`);
                }
            }
        }

        if (extracted.additionalProperties && Object.keys(extracted.additionalProperties).length > 0) {
            logger.debug('Additional error properties: %o', extracted.additionalProperties);
        }

        if (extracted.stack) {
            logger.debug(`Stack trace: ${extracted.stack}`);
        }
    }
}
