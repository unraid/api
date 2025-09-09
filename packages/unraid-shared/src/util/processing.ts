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

/**
 * A mutex for asynchronous operations that ensures only one operation runs at a time.
 * 
 * When multiple callers attempt to execute operations simultaneously, they will all
 * receive the same promise from the currently running operation, effectively deduplicating
 * concurrent calls. This is useful for expensive operations like API calls, file operations,
 * or database queries that should not be executed multiple times concurrently.
 * 
 * @template T - The default return type for operations when using a default operation
 * 
 * @example
 * // Basic usage with explicit operations
 * const mutex = new AsyncMutex();
 * 
 * // Multiple concurrent calls will deduplicate
 * const [result1, result2, result3] = await Promise.all([
 *   mutex.do(() => fetch('/api/data')),
 *   mutex.do(() => fetch('/api/data')), // Same request, will get same promise
 *   mutex.do(() => fetch('/api/data'))  // Same request, will get same promise
 * ]);
 * // Only one fetch actually happens
 * 
 * @example
 * // Usage with a default operation
 * const dataLoader = new AsyncMutex(() => 
 *   fetch('/api/expensive-data').then(res => res.json())
 * );
 * 
 * const data1 = await dataLoader.do(); // Executes the fetch
 * const data2 = await dataLoader.do(); // If first promise is finished, a new fetch is executed
 */
export class AsyncMutex<T = unknown> {
  private currentOperation: Promise<any> | null = null;
  private defaultOperation?: AsyncOperation<T>;

  /**
   * Creates a new AsyncMutex instance.
   * 
   * @param operation - Optional default operation to execute when calling `do()` without arguments.
   *                   This is useful when you have a specific operation that should be deduplicated.
   * 
   * @example
   * // Without default operation (shared mutex)
   * const mutex = new AsyncMutex();
   * const promise1 = mutex.do(() => someAsyncWork());
   * const promise2 = mutex.do(() => someOtherAsyncWork());
   * 
   * // Both promises will be the same
   * expect(await promise1).toBe(await promise2);
   * 
   * // After the first operation completes, new operations can run
   * await promise1;
   * const newPromise = mutex.do(() => someOtherAsyncWork()); // This will execute
   * 
   * @example
   * // With default operation (deduplicating a specific operation)
   * const dataMutex = new AsyncMutex(() => loadExpensiveData());
   * await dataMutex.do(); // Executes loadExpensiveData()
   */
  constructor(operation?: AsyncOperation<T>) {
    this.defaultOperation = operation;
  }

  /**
   * Executes the default operation if one was provided in the constructor.
   * @returns Promise that resolves with the result of the default operation
   * @throws Error if no default operation was set in the constructor
   */
  do(): Promise<T>;
  /**
   * Executes the provided operation, ensuring only one runs at a time.
   * 
   * If an operation is already running, all subsequent calls will receive
   * the same promise from the currently running operation. This effectively
   * deduplicates concurrent calls to the same expensive operation.
   * 
   * @param operation - Optional operation to execute. If not provided, uses the default operation.
   * @returns Promise that resolves with the result of the operation
   * @throws Error if no operation is provided and no default operation was set
   * 
   * @example
   * const mutex = new AsyncMutex();
   * 
   * // These will all return the same promise
   * const promise1 = mutex.do(() => fetch('/api/data'));
   * const promise2 = mutex.do(() => fetch('/api/other')); // Still gets first promise!
   * const promise3 = mutex.do(() => fetch('/api/another')); // Still gets first promise!
   * 
   * // After the first operation completes, new operations can run
   * await promise1;
   * const newPromise = mutex.do(() => fetch('/api/new')); // This will execute
   */
  do<U>(operation: AsyncOperation<U>): Promise<U>;
  do<U = T>(operation?: AsyncOperation<U>): Promise<U | T> {
    if (!operation && !this.defaultOperation) {
      return Promise.reject(new Error('No operation provided and no default operation set'));
    }

    if (this.currentOperation) {
      return this.currentOperation;
    }

    const op = (operation || this.defaultOperation) as AsyncOperation<U | T>;
    const promise = Promise.resolve().then(op).finally(() => {
      if (this.currentOperation === promise) {
        this.currentOperation = null;
      }
    });
    
    this.currentOperation = promise;
    return promise;
  }
}
