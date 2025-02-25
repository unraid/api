import { AppError } from '@app/core/errors/app-error.js';

/**
 * Error bubbled up from a PHP script.
 */
export class PhpError extends AppError {}
