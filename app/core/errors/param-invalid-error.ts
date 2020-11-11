/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { AppError } from './app-error';

/**
 * Invalid param provided to module
 */
export class ParamInvalidError extends AppError {
	constructor(parameterName: string, parameter) {
		// Overriding both message and status code.
		super(`Param invalid: ${parameterName} = ${parameter}`, 500);
	}
}
