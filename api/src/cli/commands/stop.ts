import { cliLogger } from '@app/core/log';
import { getAllUnraidApiPids } from '@app/cli/get-unraid-api-pid';
import { setEnv } from '@app/cli/set-env';

/**
 * Stop a running API process.
 */
export const stop = async () => {
	setEnv('LOG_TYPE', 'raw');

	// Find process called "unraid-api"
	const unraidApiPids = await getAllUnraidApiPids();

	// Bail if we have no process
	if (unraidApiPids.length === 0) {
		cliLogger.info('Found no running processes.');
		return;
	}

	cliLogger.info('Stopping %s unraid-api process(es)...', unraidApiPids.length);
	unraidApiPids.forEach(pid => process.kill(pid, 'SIGTERM'));
	cliLogger.info('Process(es) stopped!');
};
