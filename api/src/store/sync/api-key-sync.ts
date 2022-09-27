import { FileLoadStatus, StoreSubscriptionHandler } from '@app/store/types';
import { store } from '@app/store';
import { logger } from '@app/core/log';
import { validateApiKey } from '@app/core/utils/misc/validate-api-key';
import { validateApiKeyFormat } from '@app/core/utils/misc/validate-api-key-format';
import { logoutUser } from '@app/store/modules/config';

const isApiKeyEmpty = (apiKey: string) => apiKey === undefined || (typeof apiKey === 'string' && apiKey.trim() === '');

export const syncApiKeyChanges: StoreSubscriptionHandler = async lastState => {
	// Skip checking if the the API key hasn't changed
	const { config } = store.getState();
	if (config.status !== FileLoadStatus.LOADED) return;
	const apiKey = config?.remote?.apikey;
	if (lastState?.config?.remote?.apikey === apiKey) {
		logger.trace('Remote API key is the same');
		return;
	}

	logger.trace('Remote API key changed, validating');
	let hasError = false;

	try {
		// Key is now empty so expire all cached data
		if (isApiKeyEmpty(apiKey)) {
			logger.trace('Remote API key is now empty');
			throw new Error('API Key is Empty');
		}

		// Check if the key format is valid
		validateApiKeyFormat(apiKey);
		logger.trace('API key is in the correct format, checking key\'s validity with key-server');

		// Check if the key is valid with key-server
		await validateApiKey(apiKey);
	} catch (error: unknown) {
		// Something happened?
		logger.debug('Removing remote API key as it failed validation.');
		logger.trace(error);
		hasError = true;
	} finally {
		if (hasError) {
			// Log out the user as their API key is invalid
			await store.dispatch(logoutUser());
		} else {
			logger.debug('Key-server marked this API key as valid.');
		}
	}
};
