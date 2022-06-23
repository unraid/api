/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { format } from 'util';
import { AppError } from '@app/core/errors/app-error';

/**
 * Invalid param provided to module
 */
export class ParamInvalidError extends AppError {
	constructor(parameterName: string, parameter: any) {
		// Overriding both message and status code.
		super(format('Param invalid: %s = %s', parameterName, parameter), 500);
	}
}
