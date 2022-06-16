import prettyMs from 'pretty-ms';
import pidUsage from 'pidusage';
import { cliLogger } from '@app/core/log';
import { getUnraidApiPid } from '@app/cli/get-unraid-api-pid';
import { setEnv } from '@app/cli/set-env';

export const status = async () => {
	setEnv('LOG_TYPE', 'raw');

	// Find all processes called "unraid-api" which aren't this process
	const unraidApiPid = await getUnraidApiPid();
	if (!unraidApiPid) {
		cliLogger.info('Found no running processes.');
		return;
	}

	const stats = await pidUsage(unraidApiPid);
	cliLogger.info(`API has been running for ${prettyMs(stats.elapsed)} and is in "${process.env.ENVIRONMENT!}" mode!`);
};
