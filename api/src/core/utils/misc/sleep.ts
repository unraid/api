/**
* Sleep for a certain amount of milliseconds.
* @param ms How many milliseconds to sleep for.
*/
export const sleep = async (ms: number) => new Promise<void>(resolve => {
	setTimeout(() => {
		resolve();
	}, ms);
});
