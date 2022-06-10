/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { AppError } from './app-error';

/**
 * The attempted operation can only be processed while the array is stopped.
 */
export class ArrayRunningError extends AppError {
	constructor() {
		super('Array needs to be stopped before any changes can occur.');
	}
}
