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

type IterationOptions = {
    maxIterations?: number;
};

/**
 * Traverses an object and its nested objects, passing each one to a callback function.
 *
 * This function iterates over the input object, using a stack to keep track of nested objects,
 * and applies the given modifier function to each object it encounters.
 * It prevents infinite loops by limiting the number of iterations.
 *
 * @param obj - The object to be traversed and modified.
 * @param modifier - A callback function, taking an object. Modifications should happen in place.
 */
export function updateObject(
    obj: object,
    modifier: (currentObj: object) => void,
    opts: IterationOptions = {}
) {
    const stack = [obj];
    let iterations = 0;
    const { maxIterations = 100 } = opts;
    // Prevent infinite loops
    while (stack.length > 0 && iterations < maxIterations) {
        const current = stack.pop();

        if (current && typeof current === 'object') {
            modifier(current);

            for (const value of Object.values(current)) {
                if (value && typeof value === 'object') {
                    stack.push(value);
                }
            }
        }

        iterations++;
    }
}

/**
 * Formats a timestamp into a human readable format: "MMM D, YYYY"
 * Example: "Oct 24, 2024"
 *
 * @param timestamp - ISO date string or Unix timestamp in seconds
 * @returns Formatted date string or null if timestamp is invalid
 */
export function formatTimestamp(timestamp: string | number | null | undefined): string | null {
    if (!timestamp) return null;

    try {
        // Convert Unix timestamp (seconds) to milliseconds if needed
        const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);

        if (isNaN(date.getTime())) return null;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return null;
    }
}
