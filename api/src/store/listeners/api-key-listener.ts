import { retryValidateApiKey } from '@app/mothership/api-key/retry-validate-api-key';
import { isAPIStateDataFullyLoaded } from '@app/mothership/graphql-client';
import { isApiKeyLoading } from '@app/store/getters/index';
import { store } from '@app/store/index';

export const validateApiKeyIfPresent = async () => {
    const currentState = store.getState();
    if (
        currentState.config.remote?.apikey &&
        currentState.emhttp.var.flashGuid &&
        isAPIStateDataFullyLoaded(currentState) &&
        !isApiKeyLoading(currentState)
    ) {
		await retryValidateApiKey(store.getState, store.dispatch);
    }
};
