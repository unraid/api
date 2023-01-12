import { keyServerLogger } from '@app/core/log';
import { retryValidateApiKey } from '@app/mothership/api-key/retry-validate-api-key';
import { isAPIStateDataFullyLoaded } from '@app/mothership/graphql-client';
import { isApiKeyValid, isApiKeyLoading } from '@app/store/getters/index';
import { startAppListening } from '@app/store/listeners/listener-middleware';

export const enableApiKeyListener = () => startAppListening({
	predicate(_, currentState, previousState) {
		if (
			(currentState.config.remote.apikey !== previousState.config.remote.apikey
				|| currentState.emhttp.var.flashGuid !== previousState.emhttp.var.flashGuid)
			&& isAPIStateDataFullyLoaded(currentState)
			&& !isApiKeyLoading(currentState)
		) {
			// API Key is not marked as Valid and the State Data is fully loaded
			return true;
		}

		return false;
	}, async effect(_, { getState, dispatch }) {
		keyServerLogger.info('Starting job to check API Key');
		await retryValidateApiKey(getState, dispatch);
	},
});

