/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { AppError } from '../../errors';
import { log } from '../../log';

/**
 * Exit application.
 */
export const exitApp = (error?: Error, exitCode?: number) => {
	if (!error) {
		// Kill application immediately
		process.exit(exitCode ?? 0);
	}

	// Allow non-fatal errors to throw but keep the app running
	if (error instanceof AppError) {
		if (!error.fatal) {
			log.warning(error.message);
			return;
		}

		// Log last error
		log.error(error.message);

		// Kill application
		process.exitCode = exitCode;
	} else {
		// Log last error
		log.error(error);

		// Kill application
		process.exitCode = exitCode;
	}
};
