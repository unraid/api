import { AppError } from '@app/core/errors/app-error.js';

/**
 * Fatal application error.
 */
export class FatalAppError extends AppError {
    fatal = true;
}
