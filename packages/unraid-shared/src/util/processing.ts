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

type AsyncOperation<T> = () => Promise<T>;

export class AsyncMutex<T = unknown> {
  private currentOperation: Promise<any> | null = null;
  private defaultOperation?: AsyncOperation<T>;

  constructor(operation?: AsyncOperation<T>) {
    this.defaultOperation = operation;
  }

  do(): Promise<T>;
  do<U>(operation: AsyncOperation<U>): Promise<U>;
  do<U = T>(operation?: AsyncOperation<U>): Promise<U | T> {
    if (!operation && !this.defaultOperation) {
      return Promise.reject(new Error('No operation provided and no default operation set'));
    }

    if (this.currentOperation) {
      return this.currentOperation;
    }

    const op = (operation || this.defaultOperation) as AsyncOperation<U | T>;
    
    const promise = op().finally(() => {
      if (this.currentOperation === promise) {
        this.currentOperation = null;
      }
    });
    
    this.currentOperation = promise;
    return promise;
  }
}
