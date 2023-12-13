import { setEnv } from '@app/cli/set-env';
import { start } from '@app/cli/commands/start';
import { stop } from '@app/cli/commands/stop';

/**
 * Stop a running API process and then start it again.
 */
export const restart = async () => {
	setEnv('LOG_TRANSPORT', 'stdout');
	await stop();
	await start();
};
