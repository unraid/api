// Utils related to processing operations
// e.g. parallel processing, safe processing, etc.

/**
 * Creates a function that runs a given function and catches any errors.
 * If an error is caught, it is passed to the `onError` function.
 *
 * @param onError - The function to call if an error is caught.
 * @returns A function that runs the given function and catches any errors.
 * @example
 * const errors: Error[] = [];
 * const doSafely = makeSafeRunner((error) => {
 *   if (error instanceof Error) {
 *     errors.push(error);
 *   } else {
 *     this.logger.warn(error, 'Uncaught error in network resolver');
 *   }
 * });
 *
 * doSafely(() => {
 *   JSON.parse(aFile);
 *   throw new Error('test');
 * });
 */
export function makeSafeRunner(onError: (error: unknown) => void) {
  return <T>(fn: () => T) => {
    try {
      return fn();
    } catch (error) {
      onError(error);
    }
  };
}
