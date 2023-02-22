
import { isAPIStateDataFullyLoaded } from '@app/mothership/graphql-client';
import { keyServerLogger } from '@app/core/log';
import { validateApiKeyWithKeyServer } from '@app/mothership/api-key/validate-api-key-with-keyserver';
import { type RootState, type AppDispatch } from '@app/store/index';
import { setApiKeyState } from '@app/store/modules/apikey';
import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';
import { logoutUser } from '@app/store/modules/config';
import { isApiKeyValid } from '@app/store/getters/index';
import { isApiKeyCorrectLength } from '@app/mothership/api-key/is-api-key-correct-length';
import { NODE_ENV } from '@app/environment';

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

		if (!isApiKeyCorrectLength(state.config.remote.apikey)) {
			keyServerLogger.error('API Key has invalid length, logging you out.');
			await dispatch(logoutUser({ reason: 'API Key has invalid length' }));
			return false;
		}

		if (['test', 'development'].includes(NODE_ENV)) {
			keyServerLogger.debug('In test environment, marking API Key as Valid');
			dispatch(setApiKeyState(API_KEY_STATUS.API_KEY_VALID));
			return true;
		}

		const validationResponse = await validateApiKeyWithKeyServer({ flashGuid: state.emhttp.var.flashGuid, apiKey: state.config.remote.apikey });
		switch (validationResponse) {
			case API_KEY_STATUS.API_KEY_VALID:
				keyServerLogger.info('Stopping API Key Job as Keyserver Marked API Key Valid');
				dispatch(setApiKeyState(validationResponse));
				return true;
			case API_KEY_STATUS.API_KEY_INVALID:
				await dispatch(logoutUser({ reason: 'Invalid API Key' }));
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

