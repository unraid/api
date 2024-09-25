export function notNull<T>(value: T): value is NonNullable<T> {
    return value !== null;
}

/**
 * Checks if a PromiseSettledResult is fulfilled.
 *
 * @param result A PromiseSettledResult.
 * @returns true if the result is fulfilled, false otherwise.
 */
export function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
    return result.status === 'fulfilled';
}

/**
 * Checks if a PromiseSettledResult is rejected.
 *
 * @param result A PromiseSettledResult.
 * @returns true if the result is rejected, false otherwise.
 */
export function isRejected<T>(result: PromiseSettledResult<T>): result is PromiseRejectedResult {
    return result.status === 'rejected';
}

/**
 * @returns the number of seconds since Unix Epoch
 */
export const secondsSinceUnixEpoch = (): number => Math.floor(Date.now() / 1_000);

/**
 * Helper to interop with Unraid, which communicates timestamps
 * in seconds since Unix Epoch.
 *
 * @returns the number of seconds since Unix Epoch
 */
export const unraidTimestamp = secondsSinceUnixEpoch;