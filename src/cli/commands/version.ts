import { cliLogger } from '../../core/log';
import { setEnv } from '../set-env';
import { fullVersion } from '../../../package.json';

/**
 * Print API version.
 */
export const version = async () => {
	setEnv('LOG_TYPE', 'raw');

	cliLogger.info(`Unraid API v${fullVersion as string}`);
};
