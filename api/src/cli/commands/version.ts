import { cliLogger } from '@app/core/log';
import { setEnv } from '@app/cli/set-env';
import { getters } from '@app/store';

/**
 * Print API version.
 */
export const version = async () => {
	setEnv('LOG_TYPE', 'raw');

	cliLogger.info(`Unraid API v${getters.config().version}`);
};
