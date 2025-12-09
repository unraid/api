/**
 * Wraps a promise with a timeout to prevent hangs.
 * If the operation takes longer than timeoutMs, it rejects with a timeout error.
 *
 * @param promise The promise to wrap with a timeout
 * @param timeoutMs Maximum time in milliseconds before timing out
 * @param operationName Name of the operation for the error message
 * @returns The result of the promise if it completes in time
 * @throws Error if the operation times out
 */
export const withTimeout = <T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string
): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(
                () => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)),
                timeoutMs
            )
        ),
    ]);
};
