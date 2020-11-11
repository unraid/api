/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

/**
 * Atomically sleep for a certain amount of milliseconds.
 * @param ms How many milliseconds to sleep for.
 */
export const atomicSleep = (ms: number): Promise<any> => {
	return new Promise(resolve => {
		// eslint-disable-next-line no-undef
		Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
		resolve();
	});
};
