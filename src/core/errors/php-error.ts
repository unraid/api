/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { AppError } from '@app/core/errors/app-error';

/**
 * Error bubbled up from a PHP script.
 */
export class PhpError extends AppError {}
