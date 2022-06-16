import { cliLogger } from '@app/core/log';
import { getUnraidApiPid } from '@app/cli/get-unraid-api-pid';
import { setEnv } from '@app/cli/set-env';

/**
 * Stop a running API process.
 */
export const stop = async () => {
	setEnv('LOG_TYPE', 'raw');

	// Find process called "unraid-api"
	const unraidApiPid = await getUnraidApiPid();

	// Bail if we have no process
	if (!unraidApiPid) {
		cliLogger.info('Found no running processes.');
		return;
	}

	cliLogger.info('Stopping unraid-api process...');
	process.kill(unraidApiPid, 'SIGTERM');
	cliLogger.info('Process stopped!');
};
