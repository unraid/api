import { describe, it, vi, expect } from 'vitest';

import { type RootState } from '@app/store/index';
import { retryValidateApiKey } from '@app/mothership/api-key/retry-validate-api-key';
import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';
import { type RecursivePartial } from '@app/types/index';

vi.mock('@app/mothership/jobs/api-key-check-jobs');

describe('API Key check jobs backoff logic tests', () => {
	it('Calls retry once when it succeeds immediately', async () => {
		const apiKeyCheckJobs = await import('@app/mothership/jobs/api-key-check-jobs');
		const state: RecursivePartial<RootState> = {
			apiKey: { status: API_KEY_STATUS.NO_API_KEY },
			config: { remote: { apikey: '_______________________BIG_API_KEY_HERE_________________________' } },
			emhttp: { var: { flashGuid: 'my-flash-guid', version: '6.11.2' } },
		};
		const getState = vi.fn().mockReturnValue(state);

		const dispatch = vi.fn().mockImplementation(() => {
			state.apiKey!.status = API_KEY_STATUS.PENDING_VALIDATION;
		});

		const spy = vi.spyOn(apiKeyCheckJobs, 'apiKeyCheckJob').mockResolvedValue(true);
		await retryValidateApiKey(getState, dispatch);

		expect(spy).toHaveBeenCalledTimes(1);
	});
	it('Calls retry multiple times with a backoff ', async () => {
		const apiKeyCheckJobs = await import('@app/mothership/jobs/api-key-check-jobs');

		const state: RecursivePartial<RootState> = {
			apiKey: { status: API_KEY_STATUS.NO_API_KEY },
			config: { remote: { apikey: '_______________________BIG_API_KEY_HERE_________________________' } },
			emhttp: { var: { flashGuid: 'my-flash-guid', version: '6.11.2' } },
		};
		const getState = vi.fn().mockReturnValue(state);

		const dispatch = vi.fn().mockImplementation(() => {
			state.apiKey!.status = API_KEY_STATUS.PENDING_VALIDATION;
		});

		const spy = vi.spyOn(apiKeyCheckJobs, 'apiKeyCheckJob').mockImplementation(vi.fn()
			.mockRejectedValueOnce(
				new Error('Invalid'),
			)
			.mockResolvedValue(true),
		);

		await retryValidateApiKey(getState, dispatch);
		expect(spy).toHaveBeenCalledTimes(2);
	}, 5_000);
});

