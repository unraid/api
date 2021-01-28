/**
 * A typeguarded version of `instanceof Error` for NodeJS.
 */
export function isNodeError<T extends new (...args: any[]) => Error>(value: unknown, errorType?: T): value is InstanceType<T> & NodeJS.ErrnoException {
	return value instanceof (errorType ? errorType : Error);
}
