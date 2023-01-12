import { THIRTY_MINUTES_MS } from '@app/consts';
import { keyServerLogger } from '@app/core/log';
import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';
import { apiKeyCheckJob } from '@app/mothership/jobs/api-key-check-jobs';
import { type AppDispatch, type RootState } from '@app/store/index';
import { setApiKeyState } from '@app/store/modules/apikey';
import pRetry from 'p-retry';

export const retryValidateApiKey = async (getState: () => RootState, dispatch: AppDispatch): Promise<boolean> => {
	if (getState().apiKey.status === API_KEY_STATUS.PENDING_VALIDATION) {
		// Don't start a new job
		keyServerLogger.debug('Not starting a new job as a key validation is currently pending');
		return false;
	}

	// Start job here
	dispatch(setApiKeyState(API_KEY_STATUS.PENDING_VALIDATION));
	const retryResult = await pRetry(async count => apiKeyCheckJob(getState, dispatch, count), {
		retries: 20_000,
		minTimeout: 2_000,
		maxTimeout: THIRTY_MINUTES_MS,
		randomize: true,
		factor: 2,
	});
	return retryResult;
	// Run recursive set timeout job
};
