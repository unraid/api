/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { FatalAppError } from './fatal-error';

/**
 * Em cmd client error.
 */
export class EmCmdError extends FatalAppError {
	constructor(method: string, option: string, options: string[]) {
		const message = `Invalid option "${option}" for ${method}, allowed options ${JSON.stringify(options)}`;
		super(message);
	}
}
