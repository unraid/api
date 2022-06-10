/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { FatalAppError } from './fatal-error';

/**
 * Atomic write error
 */
export class AtomicWriteError extends FatalAppError {
	constructor(message: string, private readonly filePath: string, status = 500) {
		super(message, status);
	}
}
