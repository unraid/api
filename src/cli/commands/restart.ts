import { setEnv } from '../set-env';
import { start } from './start';
import { stop } from './stop';

/**
 * Stop a running API process and then start it again.
 */
export const restart = async () => {
	setEnv('LOG_TYPE', 'raw');

	await stop();
	await start();
};
