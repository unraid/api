/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { FatalAppError } from '@app/core/errors/fatal-error';

/**
 * Atomic write error
 */
export class AtomicWriteError extends FatalAppError {
	constructor(message: string, private readonly filePath: string, status = 500) {
		super(message, status);
	}
}
