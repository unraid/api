import { cliLogger } from '@app/core/log';
import { setEnv } from '@app/cli/set-env';
import { API_VERSION } from '@app/environment';

/**
 * Print API version.
 */
export const version = async () => {
	setEnv('LOG_TYPE', 'raw');

	cliLogger.info(`Unraid API v${API_VERSION}`);
};
