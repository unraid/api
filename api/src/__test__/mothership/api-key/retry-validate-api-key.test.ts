import { describe, it, vi, expect } from 'vitest';

import { store } from '@app/store/index';
import { loadConfigFile } from '@app/store/modules/config';
import { loadStateFiles } from '@app/store/modules/emhttp';
import { retryValidateApiKey } from '@app/mothership/api-key/retry-validate-api-key';
import { setApiKeyState } from '@app/store/modules/apikey';
import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';

vi.mock('@app/mothership/jobs/api-key-check-jobs');

describe('API Key check jobs backoff logic tests', () => {
	it('Calls retry once when it succeeds immediately', async () => {
		const apiKeyCheckJobs = await import('@app/mothership/jobs/api-key-check-jobs');
		await store.dispatch(loadConfigFile());
		await store.dispatch(loadStateFiles());

		const spy = vi.spyOn(apiKeyCheckJobs, 'apiKeyCheckJob').mockResolvedValue(true);
		await retryValidateApiKey(store.getState, store.dispatch);

		store.dispatch(setApiKeyState(API_KEY_STATUS.NO_API_KEY));

		expect(spy).toHaveBeenCalledTimes(1);
	});
	it('Calls retry multiple times with a backoff ', async () => {
		const apiKeyCheckJobs = await import('@app/mothership/jobs/api-key-check-jobs');

		await store.dispatch(loadConfigFile());
		await store.dispatch(loadStateFiles());

		const spy = vi.spyOn(apiKeyCheckJobs, 'apiKeyCheckJob').mockImplementation(vi.fn()
			.mockRejectedValueOnce(
				new Error('Invalid'),
			)
			.mockResolvedValue(true),
		);

		await retryValidateApiKey(store.getState, store.dispatch);
		expect(spy).toHaveBeenCalledTimes(2);
	}, 5_000);
});

