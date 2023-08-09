import { AppError } from '@app/core/errors/app-error';

/**
 * The provided file is missing
 */
export class FileMissingError extends AppError {
	/**
	 * @hideconstructor
	 */
	constructor(private readonly filePath: string) {
		// Overriding both message and status code.
		super('File missing: ' + filePath, 400);
	}
}
