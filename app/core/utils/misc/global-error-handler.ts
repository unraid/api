/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { exitApp } from '..';

/**
 * Handles all global, bubbled and uncaught errors.
 *
 * @name Utils~globalErrorHandler
 * @param {Error} error
 * @private
 */
export const globalErrorHandler = (error: Error) => {
	try {
		exitApp(error, 1);
	} catch (error: unknown) {
		// We should only end up here if `Errors` or `Core.log` have an issue loading.

		// Log last error
		console.error(error);

		// Kill application
		process.exit(1);
	}
};
