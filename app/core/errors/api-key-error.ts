/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { AppError } from './app-error';

/**
* API key error.
*/
export class ApiKeyError extends AppError {
   constructor(message: string) {
       super(message);
   }
}
