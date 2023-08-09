import { AppError } from '@app/core/errors/app-error';

/**
* API key error.
*/
export class ApiKeyError extends AppError {
	// eslint-disable-next-line @typescript-eslint/no-useless-constructor
	constructor(message: string) {
		super(message);
	}
}
