/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { AppError } from '@app/core/errors/app-error';

/**
 * Required param is missing
 */
export class ParameterMissingError extends AppError {
	constructor(parameterName: string) {
		// Override both message and status code.
		super(`Param missing: ${parameterName}`, 500);
	}
}
