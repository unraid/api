/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { AppError } from '@app/core/errors/app-error';

/**
 * Non fatal permission error
 */
export class PermissionError extends AppError {
	constructor(message: string) {
		super(message || 'Permission denied!');
	}
}
