/**
 * @fileoverview Shared utility functions for system integration tests.
 */

export const ONE_SECOND = 1000;
export const FIVE_SECONDS = 5 * ONE_SECOND;
export const TEN_SECONDS = 10 * ONE_SECOND;
export const ONE_MINUTE = 60 * ONE_SECOND;
export const FIVE_MINUTES = 5 * ONE_MINUTE;
export const TEN_MINUTES = 10 * ONE_MINUTE;
export const FIFTEEN_MINUTES = 15 * ONE_MINUTE;

/**
 * Utility function to pause execution.
 * @param ms - Duration to sleep in milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
