import { FatalAppError } from '@app/core/errors/fatal-error.js';

/**
 * Atomic write error
 */
export class AtomicWriteError extends FatalAppError {
    constructor(
        message: string,
        private readonly filePath: string,
        status = 500
    ) {
        super(message, status);
    }
}
