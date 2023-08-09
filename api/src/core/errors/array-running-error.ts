import { AppError } from '@app/core/errors/app-error';

/**
 * The attempted operation can only be processed while the array is stopped.
 */
export class ArrayRunningError extends AppError {
	constructor() {
		super('Array needs to be stopped before any changes can occur.');
	}
}
