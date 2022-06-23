/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { AppError } from '@app/core/errors/app-error';

/**
 * Fatal application error.
 */
export class FatalAppError extends AppError {
	fatal = true;
}
