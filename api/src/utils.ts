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