import { setEnv } from '@app/cli/set-env';
import { start } from '@app/cli/commands/start';
import { stop } from '@app/cli/commands/stop';
import { sleep } from '@app/core/utils/misc/sleep';

/**
 * Stop a running API process and then start it again.
 */
export const restart = async () => {
	setEnv('LOG_TYPE', 'raw');

	await stop();
	await sleep(50);
	await start();
};
