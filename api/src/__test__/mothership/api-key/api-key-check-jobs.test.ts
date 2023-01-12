import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';
import * as apiKeyCheckJobs from '@app/mothership/jobs/api-key-check-jobs';
import * as apiKeyValidator from '@app/mothership/api-key/validate-api-key-with-keyserver';
import { describe, expect, it, vi } from 'vitest';
import { type RecursivePartial } from '@app/types/index';
import { type RootState } from '@app/store/index';
import { logoutUser } from '@app/store/modules/config';

describe('apiKeyCheckJob Tests', () => {
	it('API Check Job (with success)', async () => {
		const getState = vi.fn<[], RecursivePartial<RootState>>().mockReturnValue({
			apiKey: { status: API_KEY_STATUS.PENDING_VALIDATION },
			config: { remote: { apikey: '_______________________BIG_API_KEY_HERE_________________________' } },
			emhttp: { var: { flashGuid: 'my-flash-guid', version: '6.11.5' } },
		});

		const dispatch = vi.fn();

		const validationSpy = vi.spyOn(apiKeyValidator, 'validateApiKeyWithKeyServer').mockResolvedValue(API_KEY_STATUS.API_KEY_VALID);

		await expect(apiKeyCheckJobs.apiKeyCheckJob(getState, dispatch)).resolves.toBe(true);

		expect(validationSpy).toHaveBeenCalledOnce();

		expect(dispatch).toHaveBeenLastCalledWith({
			payload: API_KEY_STATUS.API_KEY_VALID,
			type: 'apiKey/setApiKeyState',
		});
	});

	it('API Check Job (with invalid length key)', async () => {
		// Setup state
		const getState = vi.fn<[], RecursivePartial<RootState>>().mockReturnValue({
			apiKey: { status: API_KEY_STATUS.PENDING_VALIDATION },
			config: { remote: { apikey: 'too-short-key' } },
			emhttp: { var: { flashGuid: 'my-flash-guid', version: '6.11.5' } },
		});

		const dispatch = vi.fn();

		const validationSpy = vi.spyOn(apiKeyValidator, 'validateApiKeyWithKeyServer').mockResolvedValue(API_KEY_STATUS.API_KEY_VALID);

		await expect(apiKeyCheckJobs.apiKeyCheckJob(getState, dispatch)).resolves.toBe(false);
		expect(dispatch).toHaveBeenCalledWith(expect.any(Function));

		expect(validationSpy).not.toHaveBeenCalled();
	});

	it('API Check Job (with a failure that throws an error - NETWORK_ERROR)', async () => {
		const getState = vi.fn<[], RecursivePartial<RootState>>().mockReturnValue({
			apiKey: { status: API_KEY_STATUS.PENDING_VALIDATION },
			config: { remote: { apikey: '_______________________BIG_API_KEY_HERE_________________________' } },
			emhttp: { var: { flashGuid: 'my-flash-guid', version: '6.11.5' } },
		});

		const dispatch = vi.fn();

		const validationSpy = vi.spyOn(apiKeyValidator, 'validateApiKeyWithKeyServer')
			.mockResolvedValueOnce(API_KEY_STATUS.NETWORK_ERROR);

		await expect(apiKeyCheckJobs.apiKeyCheckJob(getState, dispatch)).rejects.toThrowErrorMatchingInlineSnapshot('"Keyserver Failure, must retry"');

		expect(validationSpy).toHaveBeenCalledOnce();

		expect(dispatch).toHaveBeenCalledWith({
			payload: API_KEY_STATUS.NETWORK_ERROR,
			type: 'apiKey/setApiKeyState',
		});
	});

	it('API Check Job (with a failure that throws an error - INVALID_RESPONSE)', async () => {
		const getState = vi.fn<[], RecursivePartial<RootState>>().mockReturnValue({
			apiKey: { status: API_KEY_STATUS.PENDING_VALIDATION },
			config: { remote: { apikey: '_______________________BIG_API_KEY_HERE_________________________' } },
			emhttp: { var: { flashGuid: 'my-flash-guid', version: '6.11.5' } },
		});

		const dispatch = vi.fn();

		const validationSpy = vi.spyOn(apiKeyValidator, 'validateApiKeyWithKeyServer')
			.mockResolvedValueOnce(API_KEY_STATUS.INVALID_KEYSERVER_RESPONSE);

		await expect(apiKeyCheckJobs.apiKeyCheckJob(getState, dispatch)).rejects.toThrowErrorMatchingInlineSnapshot('"Keyserver Failure, must retry"');

		expect(validationSpy).toHaveBeenCalledOnce();

		expect(dispatch).toHaveBeenCalledWith({
			payload: API_KEY_STATUS.INVALID_KEYSERVER_RESPONSE,
			type: 'apiKey/setApiKeyState',
		});
	}, 10_000);

	it('API Check Job (with failure that results in a log out)', async () => {
		const getState = vi.fn<[], RecursivePartial<RootState>>().mockReturnValue({
			apiKey: { status: API_KEY_STATUS.PENDING_VALIDATION },
			config: { remote: { apikey: '_______________________BIG_API_KEY_HERE_________________________' } },
			emhttp: { var: { flashGuid: 'my-flash-guid', version: '6.11.5' } },
		});

		const dispatch = vi.fn();

		const validationSpy = vi.spyOn(apiKeyValidator, 'validateApiKeyWithKeyServer')
			.mockResolvedValue(API_KEY_STATUS.API_KEY_INVALID);

		await expect(apiKeyCheckJobs.apiKeyCheckJob(getState, dispatch)).resolves.toBe(false);

		expect(validationSpy).toHaveBeenCalledOnce();
		expect(dispatch).toHaveBeenCalledTimes(1);
		expect(dispatch).toHaveBeenCalledWith(expect.any(Function));
	}, 10_000);
});
