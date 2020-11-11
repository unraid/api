/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { AppError } from './app-error';

/**
 * Fatal application error.
 */
export class FatalAppError extends AppError {
	fatal = true;
}
