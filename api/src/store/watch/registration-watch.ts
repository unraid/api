import { store } from '@app/store';
import { loadRegistrationKey } from '@app/store/modules/registration';
import { watch } from 'chokidar';

export const setupRegistrationKeyWatch = () => {
	watch('/boot/config', {
		persistent: true,
		ignoreInitial: true,
		ignored: (path: string) => !path.endsWith('.key'),
	}).on('all', async () => {
		// Load updated key into store
		await store.dispatch(loadRegistrationKey());
	});
};
