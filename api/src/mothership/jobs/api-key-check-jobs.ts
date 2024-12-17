import { isAPIStateDataFullyLoaded } from '@app/mothership/graphql-client';
import { keyServerLogger } from '@app/core/log';
import { type RootState, type AppDispatch } from '@app/store/index';
import { setApiKeyState } from '@app/store/modules/apikey';
import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';
import { logoutUser } from '@app/store/modules/config';
import { isApiKeyValid } from '@app/store/getters/index';
import { isApiKeyCorrectLength } from '@app/mothership/api-key/is-api-key-correct-length';
import { NODE_ENV } from '@app/environment';

export const apiKeyCheckJob = async (
    getState: () => RootState,
    dispatch: AppDispatch,
    count?: number
): Promise<boolean> => {
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

        if (['development'].includes(NODE_ENV)) {
            keyServerLogger.debug('In dev environment, marking API Key as Valid');
        }
        
        dispatch(setApiKeyState(API_KEY_STATUS.API_KEY_VALID));
        return true;
    } else {
        keyServerLogger.warn('State Data Has Not Fully Loaded, this should not be possible');
        dispatch(setApiKeyState(API_KEY_STATUS.NO_API_KEY));
        return false;
    }
};
