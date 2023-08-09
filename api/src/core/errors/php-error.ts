import { AppError } from '@app/core/errors/app-error';

/**
 * Error bubbled up from a PHP script.
 */
export class PhpError extends AppError {}
