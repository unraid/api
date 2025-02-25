import { AppError } from '@app/core/errors/app-error.js';

/**
 * Module is missing a needed field
 */
export class FieldMissingError extends AppError {
    constructor(private readonly field: string) {
        // Overriding both message and status code.
        super(`Field missing: ${field}`, 400);
    }
}
