import { cliLogger } from '@app/core/log';
import { setEnv } from '@app/cli/set-env';
import { fullVersion } from '@app/../package.json';

/**
 * Print API version.
 */
export const version = async () => {
	setEnv('LOG_TYPE', 'raw');

	cliLogger.info(`Unraid API v${fullVersion as string}`);
};
