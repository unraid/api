import findProcess from 'find-process';

export const getAllUnraidApiPids = async (): Promise<number[]> => {
	const pids = await findProcess('name', 'unraid-api', true);
	return pids.filter(allProcess => allProcess.pid !== process.pid)
		.map(found => found.pid);
};

export const getUnraidApiPid = async () => {
	// Find all processes called "unraid-api" which aren't this process
	const pids = await findProcess('name', 'unraid-api', true);
	return pids.find(_ => _.pid !== process.pid)?.pid;
};
