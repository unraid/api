/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { AppError } from './app-error';

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
