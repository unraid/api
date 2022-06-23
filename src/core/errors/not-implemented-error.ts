/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { AppError } from '@app/core/errors/app-error';

/**
 * Whatever this is attached to isn't yet implemented.
 * Sorry about that. 😔
 */
export class NotImplementedError extends AppError {
	constructor() {
		super('Not implemented!');
	}
}
