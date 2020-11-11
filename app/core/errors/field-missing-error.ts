/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { AppError } from './app-error';

/**
 * Module is missing a needed field
 */
export class FieldMissingError extends AppError {
	constructor(private readonly field: string) {
		// Overriding both message and status code.
		super('Field missing: ' + field, 400);
	}
}
