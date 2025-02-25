import { exitApp } from '@app/core/utils/misc/exit-app.js';

/**
 * Handles all global, bubbled and uncaught errors.
 *
 * @name Utils~globalErrorHandler
 * @param {Error} error
 * @private
 */
export const globalErrorHandler = (error: Error) => {
    console.warn('Uncaught Exception!\nStopping unraid-api!');
    try {
        exitApp(error, 1);
    } catch (error: unknown) {
        // We should only end up here if `Errors` or `Core.log` have an issue loading.

        // Log last error
        console.error(error);

        // Kill application
        process.exitCode = 1;
    }
};
