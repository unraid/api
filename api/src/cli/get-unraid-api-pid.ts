import { UNRAID_API_BIN } from '@app/consts';
import findProcess from 'find-process';

export const getAllUnraidApiPids = async (): Promise<number[]> => {
	const pids = await findProcess('name', 'unraid-api', true);
	return pids.filter(allProcess => allProcess.pid !== process.pid && allProcess.cmd.includes(UNRAID_API_BIN))
		.map(apiProcess => apiProcess.pid);
};

export const getUnraidApiPid = async (): Promise<number | undefined> => {
	// Find all processes called "unraid-api" which aren't this process
	const pids = await findProcess('name', 'unraid-api', true);

	return pids.find(_ => _.pid !== process.pid && _.cmd.includes(UNRAID_API_BIN))?.pid;
};
