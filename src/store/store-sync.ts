import { watch } from 'chokidar';
import { writeFile } from 'fs/promises';
import { Serializer as IniSerializer } from 'multi-ini';
import { logger } from '@app/core/log';
import { store } from '@app/store';
import { FileLoadStatus, loadConfigFile } from '@app/store/modules/config';
import { apiManager } from '@app/core/api-manager';
import { pubsub } from '@app/core/pubsub';
import { checkTwoFactorEnabled } from '@app/common/two-factor';

// Ini serializer
const serializer = new IniSerializer({
	// This ensures it ADDs quotes
	keep_quotes: false,
});

export const startStoreSync = async () => {
	const paths = await import('@app/store').then(_ => _.getters.paths());
	const configPath = paths['myservers-config'];

	// The last state is stored so we don't end up in a loop of writing -> reading -> writing
	let lastState: string;

	// Update cfg when store changes
	store.subscribe(async () => {
		const { config } = store.getState();
		if (config.status !== FileLoadStatus.LOADED) return;

		logger.debug('Dumping MyServers config back to file');

		// Get current state
		const { api, local, notifier, remote, upc } = config;

		// Stringify state
		const stringifiedData = serializer.serialize({ api, local, notifier, remote, upc });

		// We already wrote this to the file
		if (stringifiedData === lastState) return;
		lastState = stringifiedData;

		// Update config file
		await writeFile(configPath, stringifiedData);
	});

	// Update API manager when store changes
	store.subscribe(async () => {
		await apiManager.checkKey(configPath, true);
	});

	// Update 2FA when store changes
	store.subscribe(async () => {
		const { isRemoteEnabled, isLocalEnabled } = checkTwoFactorEnabled();

		// Publish to 2fa endpoint
		await pubsub.publish('twoFactor', {
			twoFactor: {
				remote: {
					enabled: isRemoteEnabled,
				},
				local: {
					enabled: isLocalEnabled,
				},
			},
		});
	});

	// Update store when cfg changes
	watch(configPath, {
		persistent: true,
		ignoreInitial: true,
	}).on('change', async () => {
		// Load my servers config file into store
		await store.dispatch(loadConfigFile());
	});
};
