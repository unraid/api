
import { isAPIStateDataFullyLoaded } from '@app/mothership/graphql-client';
import { keyServerLogger } from '@app/core/log';
import { validateApiKeyWithKeyServer } from '@app/mothership/api-key/validate-api-key-with-keyserver';
import { type RootState, type AppDispatch } from '@app/store/index';
import { setApiKeyState } from '@app/store/modules/apikey';
import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';
import { logoutUser } from '@app/store/modules/config';
import { isApiKeyValid } from '@app/store/getters/index';

export const apiKeyCheckJob = async (getState: () => RootState, dispatch: AppDispatch, count?: number): Promise<boolean> => {
	keyServerLogger.debug('Running keyserver validation number: %s', count);
	const state = getState();
	if (state.apiKey.status === API_KEY_STATUS.NO_API_KEY) {
		// Stop Job
		return false;
	}

	if (isAPIStateDataFullyLoaded(state)) {
		if (isApiKeyValid(state)) {
			return true;
		}

		const validationResponse = await validateApiKeyWithKeyServer({ flashGuid: state.emhttp.var.flashGuid, apiKey: state.config.remote.apikey });
		switch (validationResponse) {
			case API_KEY_STATUS.API_KEY_VALID:
				keyServerLogger.info('Stopping API Key Job as Keyserver Marked API Key Valid');
				dispatch(setApiKeyState(validationResponse));
				return true;
			case API_KEY_STATUS.API_KEY_INVALID:
				keyServerLogger.info('Logging out user, invalid API Key');
				await dispatch(logoutUser());
				return false;
			default:
				keyServerLogger.info('Request failed with status:', validationResponse);
				dispatch(setApiKeyState(validationResponse));
				throw new Error('Keyserver Failure, must retry');
		}
	} else {
		keyServerLogger.warn('State Data Has Not Fully Loaded, this should not be possible');
		dispatch(setApiKeyState(API_KEY_STATUS.NO_API_KEY));
		return false;
	}
};

