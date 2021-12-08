export const debounce = function<ArgumentsType extends unknown[], ReturnType>(
	fn: (...args: ArgumentsType) => PromiseLike<ReturnType | void>,
	wait: number
): (...args: ArgumentsType) => Promise<ReturnType | void> {
	let timeout: NodeJS.Timeout | null;
	return async function (this: any, ...args: ArgumentsType) {
		if (!Number.isFinite(wait)) {
			throw new TypeError('Expected `wait` to be a finite number');
		}

		// If we're still on a timeout ignore this call
		if (timeout) {
			return;
		}

		// Start a timeout for the next call
		timeout = setTimeout(() => {
			timeout = null;
		}, wait);

		// Resolve
		return fn.apply(this, args);
	};
};
