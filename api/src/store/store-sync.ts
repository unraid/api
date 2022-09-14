import { watch } from 'chokidar';
import { writeFile } from 'fs/promises';
import { Serializer as IniSerializer } from 'multi-ini';
import { logger } from '@app/core/log';
import { getters, store } from '@app/store';
import { loadConfigFile, updateUserConfig } from '@app/store/modules/config';
import { pubsub } from '@app/core/pubsub';
import { checkTwoFactorEnabled } from '@app/common/two-factor';
import { MyServersConfig } from '@app/types/my-servers-config';
import { validateApiKeyFormat } from '@app/core/utils/misc/validate-api-key-format';
import { validateApiKey } from '@app/core/utils/misc/validate-api-key';
import { FileLoadStatus } from '@app/store/types';
import { clearAllServers } from '@app/store/modules/servers';

// Ini serializer
const serializer = new IniSerializer({
	// This ensures it ADDs quotes
	keep_quotes: false,
});

const isApiKeyEmpty = (apiKey: string) => apiKey === undefined || (typeof apiKey === 'string' && apiKey.trim() === '');

export const startStoreSync = async () => {
	const configPath = getters.paths()['myservers-config'];

	// The last state is stored so we don't end up in a loop of writing -> reading -> writing
	let lastState: Partial<MyServersConfig>;

	// Update cfg when store changes
	store.subscribe(async () => {
		const { config } = store.getState();
		if (config.status !== FileLoadStatus.LOADED) return;

		logger.debug('Dumping MyServers config back to file');

		// Get current state
		const { api, local, notifier, remote, upc } = config;

		// Create new state
		const newState = { api, local, notifier, remote, upc };

		// We already wrote this to the file
		if (newState === lastState) return;
		lastState = newState;

		// Stringify state
		const stringifiedData = serializer.serialize({ api, local, notifier, remote, upc });

		// Update config file
		await writeFile(configPath, stringifiedData);
	});

	// Handle remote API key when store changes
	store.subscribe(async () => {
		const state = getters.config();
		logger.trace('Store updated, checking if API key changed');

		// Skip checking if the the API key hasn't changed
		if (lastState.remote?.apikey === state.remote?.apikey) {
			logger.trace('Remote API key is the same');
			return;
		}

		try {
			const apiKey = state.remote.apikey;

			// Key is now empty so expire all cached data
			if (isApiKeyEmpty(apiKey)) {
				logger.trace('Remote API key is now empty');

				// Clear servers cache
				store.dispatch(clearAllServers());

				// Clear user config
				store.dispatch(updateUserConfig({
					remote: {
						'2Fa': undefined,
						apikey: undefined,
						avatar: undefined,
						email: undefined,
						username: undefined,
						wanaccess: undefined,
						wanport: undefined,
					},
				}));

				// Publish to servers endpoint
				await pubsub.publish('servers', {
					servers: [],
				});

				// Publish to owner endpoint
				await pubsub.publish('owner', {
					owner: {
						username: 'root',
						url: '',
						avatar: '',
					},
				});
			}

			logger.trace('Remote API key changed, validating');

			// Check if the key format is valid
			validateApiKeyFormat(apiKey);
			logger.trace('API key is in the correct format, checking key\'s validity with key-server');

			// Check if the key is valid with key-server
			await validateApiKey(apiKey);
			logger.debug('Key-server marked this API key as valid.');
		} catch (error: unknown) {
			// Something happened?
			logger.debug('Removing remote API key as it failed validation.');
			logger.trace(error);

			// Reset key as it's not valid at this point
			store.dispatch(updateUserConfig({
				remote: {
					apikey: undefined,
				},
			}));
		}
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
