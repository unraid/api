/**
 * Atomically sleep for a certain amount of milliseconds.
 * @param ms How many milliseconds to sleep for.
 */
export const atomicSleep = async (ms: number): Promise<any> => new Promise<void>(resolve => {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
	resolve();
});
