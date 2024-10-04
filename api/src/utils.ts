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

/**
 * Wrapper for Promise-handling of batch operations based on
 * a list of items.
 *
 * @param items a list of items to process
 * @param action an async function operating on an item from the list
 * @returns
 *   - data: return values from each successful action
 *   - errors: list of errors (Promise Failure Reasons)
 *   - successes: # of successful actions
 *   - errorOccured: true if at least one error occurred
 */
export async function batchProcess<Input, T>(items: Input[], action: (id: Input) => Promise<T>) {
    const processes = items.map(action);

    const results = await Promise.allSettled(processes);
    const successes = results.filter(isFulfilled).map((result) => result.value);
    const errors = results.filter(isRejected).map((result) => result.reason);

    return {
        data: successes,
        successes: successes.length,
        errors: errors,
        errorOccured: errors.length > 0,
    };
}
