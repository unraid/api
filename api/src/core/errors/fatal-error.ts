import { AppError } from '@app/core/errors/app-error';

/**
 * Fatal application error.
 */
export class FatalAppError extends AppError {
	fatal = true;
}
