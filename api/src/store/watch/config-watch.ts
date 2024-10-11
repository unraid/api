import { getters, store } from '@app/store';
import { watch } from 'chokidar';
import { loadConfigFile, logoutUser } from '@app/store/modules/config';
import { logger } from '@app/core/log';
import { existsSync, writeFileSync } from 'node:fs';

export const setupConfigPathWatch = () => {
	const myServersConfigPath = getters.paths()?.['myservers-config'];
	if (myServersConfigPath) {
		logger.info('Watch Setup on Config Path: %s', myServersConfigPath);
		if (!existsSync(myServersConfigPath)) {
			writeFileSync(myServersConfigPath, '', 'utf-8');
		}
		const watcher = watch(myServersConfigPath, {
			persistent: true,
			ignoreInitial: false,
			usePolling: process.env.NODE_ENV === 'development',
		}).on('change', async () => {
			await store.dispatch(loadConfigFile());
		}).on('unlink', async () => {
			watcher.close();
			setupConfigPathWatch();
			store.dispatch(logoutUser({ reason: 'Config File was Deleted'}))
		});
	} else {
		logger.error('[FATAL] Failed to setup watch on My Servers Config (Could Not Read Config Path)');
	}
};
