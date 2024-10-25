import { start } from '@app/cli/commands/start';
import { stop } from '@app/cli/commands/stop';

/**
 * Stop a running API process and then start it again.
 */
export const restart = async () => {
	await stop();
	await start();

	process.exit(0);
};
