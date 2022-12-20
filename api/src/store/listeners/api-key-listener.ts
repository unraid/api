import { startAppListening } from '@app/store/listeners/listener-middleware';
import { logger } from '@app/core/log';
import { validateApiKey } from '@app/core/utils/misc/validate-api-key';
import { validateApiKeyFormat } from '@app/core/utils/misc/validate-api-key-format';
import { logoutUser } from '@app/store/modules/config';

const isApiKeyEmpty = (apiKey: string) => apiKey === undefined || (typeof apiKey === 'string' && apiKey.trim() === '');

export const enableApiKeyListener = () => startAppListening({
	predicate(_, currentState, previousState) {
		if (currentState.config.remote.apikey !== previousState.config.remote.apikey) {
			return true;
		}

		return false;
	},
	async effect(_action, { getState, dispatch }) {
		// Get state
		const state = getState();
		const apiKey = state.config.remote.apikey;

		let hasError = false;

		try {
		// Key is now empty so expire all cached data
			if (isApiKeyEmpty(apiKey)) {
				logger.trace('Remote API key is now empty');
				throw new Error('API Key is Empty');
			}

			// Check if the key format is valid
			validateApiKeyFormat(apiKey, true);
			logger.trace('API key is in the correct format, checking key\'s validity with key-server');

			// Check if the key is valid with key-server
			await validateApiKey(apiKey, true);
		} catch (error: unknown) {
		// Something happened?
			logger.debug('Removing remote API key as it failed validation.');
			logger.trace(error);
			hasError = true;
		} finally {
			if (hasError) {
			// Log out the user as their API key is invalid
				await dispatch(logoutUser());
			} else {
				logger.debug('Key-server marked this API key as valid.');
			}
		}
	},
});
