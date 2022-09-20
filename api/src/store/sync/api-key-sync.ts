import { FileLoadStatus, StoreSubscriptionHandler } from '@app/store/types';
import { store } from '@app/store';
import { logger } from '@app/core/log';
import { pubsub } from '@app/core';
import { validateApiKey } from '@app/core/utils/misc/validate-api-key';
import { validateApiKeyFormat } from '@app/core/utils/misc/validate-api-key-format';
import { updateUserConfig } from '@app/store/modules/config';
import { clearAllServers } from '@app/store/modules/servers';

const isApiKeyEmpty = (apiKey: string) => apiKey === undefined || (typeof apiKey === 'string' && apiKey.trim() === '');

const logoutUser = async () => {
	// Clear servers cache
	store.dispatch(clearAllServers());

	// Clear user config
	store.dispatch(updateUserConfig({
		remote: {
			'2Fa': '',
			apikey: '',
			avatar: '',
			email: '',
			username: '',
			wanaccess: '',
			wanport: '',
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

export const syncApiKeyChanges: StoreSubscriptionHandler = async lastState => {
	// Skip checking if the the API key hasn't changed
	const { config } = store.getState();
	if (config.status !== FileLoadStatus.LOADED) return
	const apiKey = config?.remote?.apikey;
	if (lastState?.config?.remote?.apikey === apiKey) {
		logger.trace('Remote API key is the same');
		return;
	}

	try {
		// Key is now empty so expire all cached data
		if (isApiKeyEmpty(apiKey)) {
			logger.trace('Remote API key is now empty');

			await logoutUser()
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

		// Log out the user as their API key is invalid
		await logoutUser()
	}
};
