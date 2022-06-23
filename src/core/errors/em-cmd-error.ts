/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { FatalAppError } from '@app/core/errors/fatal-error';

/**
 * Em cmd client error.
 */
export class EmCmdError extends FatalAppError {
	constructor(method: string, option: string, options: string[]) {
		const message = `Invalid option "${option}" for ${method}, allowed options ${JSON.stringify(options)}`;
		super(message);
	}
}
