import { AppError } from '@app/core/errors/app-error.js';

/**
 * Whatever this is attached to isn't yet implemented.
 * Sorry about that. 😔
 */
export class NotImplementedError extends AppError {
    constructor() {
        super('Not implemented!');
    }
}
