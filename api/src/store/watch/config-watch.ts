import { getters, store } from '@app/store';
import { watch } from 'chokidar';
import { loadConfigFile } from '@app/store/modules/config';

export const setupConfigPathWatch = () => {
	const configPath = getters.paths()?.['myservers-config'];

	// Update store when cfg changes
	watch(configPath, {
		persistent: true,
		ignoreInitial: true,
	}).on('change', async () => {
		// Load updated myservers config file into store
		await store.dispatch(loadConfigFile());
	});
};
