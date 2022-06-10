/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { AppError } from './app-error';

/**
 * Non fatal permission error
 */
export class PermissionError extends AppError {
	constructor(message: string) {
		super(message || 'Permission denied!');
	}
}
