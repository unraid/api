import { keyServerLogger } from '@app/core/log';
import { retryValidateApiKey } from '@app/mothership/api-key/retry-validate-api-key';
import { isAPIStateDataFullyLoaded } from '@app/mothership/graphql-client';
import { isApiKeyValid } from '@app/store/getters/index';
import { startAppListening } from '@app/store/listeners/listener-middleware';

export const enableApiKeyListener = () => startAppListening({
	predicate(_, currentState) {
		if (isAPIStateDataFullyLoaded(currentState) && !isApiKeyValid(currentState)) {
			// API Key is not marked as Valid and the State Data is fully loaded
			return true;
		}

		return false;
	}, effect(_, { getState, dispatch }) {
		keyServerLogger.info('Starting job to check API Key');
		void retryValidateApiKey(getState, dispatch);
	},
});

