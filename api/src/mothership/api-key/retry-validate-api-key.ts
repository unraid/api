import { THIRTY_MINUTES_MS } from '@app/consts';
import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';
import { apiKeyCheckJob } from '@app/mothership/jobs/api-key-check-jobs';
import { type AppDispatch, type RootState } from '@app/store/index';
import { isApiKeyLoading } from '@app/store/getters/index';
import pRetry from 'p-retry';
import { setApiKeyState } from '@app/store/modules/apikey';
import { keyServerLogger } from '@app/core/log';

export const retryValidateApiKey = async (getState: () => RootState, dispatch: AppDispatch): Promise<void> => {
	// Start job here
	if (isApiKeyLoading(getState())) {
		keyServerLogger.warn('Already running API Key validation, not starting another job');
	} else {
		keyServerLogger.info('Starting API Key Validation Job');
		dispatch(setApiKeyState(API_KEY_STATUS.PENDING_VALIDATION));
		await pRetry(async count => apiKeyCheckJob(getState, dispatch, count), {
			retries: 20_000,
			minTimeout: 2_000,
			maxTimeout: THIRTY_MINUTES_MS,
			randomize: true,
			factor: 2,
		});
	// Run recursive set timeout job
	}
};
