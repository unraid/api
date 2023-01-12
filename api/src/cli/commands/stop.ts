import { cliLogger } from '@app/core/log';
import { getAllUnraidApiPids } from '@app/cli/get-unraid-api-pid';
import { setEnv } from '@app/cli/set-env';
import { sleep } from '@app/core/utils/misc/sleep';
import pRetry from 'p-retry';

/**
 * Stop a running API process.
 */

export const stop = async () => {
	setEnv('LOG_TYPE', 'raw');

	try {
		await pRetry(async () => {
			const runningApis = await getAllUnraidApiPids();

			if (runningApis.length > 0) {
				cliLogger.info('Stopping %s unraid-api process(es)...', runningApis.length);
				runningApis.forEach(pid => process.kill(pid, 'SIGTERM'));

				const newPids = await getAllUnraidApiPids();

				if (newPids.length > 0) {
					throw new Error('Not all processes have exited yet');
				}
			} else {
				cliLogger.info('Found no running processes.');
				return true;
			}

			return true;
		}, {
			retries: 2,
			minTimeout: 2_000,
			factor: 1,
		});
	} catch (error: unknown) {
		cliLogger.info('Process did not exit cleanly, forcing shutdown', error);
		const processes = await getAllUnraidApiPids();
		processes.forEach(pid => process.kill(pid, 'SIGKILL'));
		await sleep(500);
	}
};
