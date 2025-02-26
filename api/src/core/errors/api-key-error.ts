import { AppError } from '@app/core/errors/app-error.js';

/**
 * API key error.
 */
export class ApiKeyError extends AppError {
    constructor(message: string) {
        super(message);
    }
}
