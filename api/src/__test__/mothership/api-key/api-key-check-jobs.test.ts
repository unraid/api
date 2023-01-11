import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';
import * as apiKeyCheckJobs from '@app/mothership/jobs/api-key-check-jobs';
import * as apiKeyValidator from '@app/mothership/api-key/validate-api-key-with-keyserver';
import * as appStore from '@app/store/index';
import { loadConfigFile } from '@app/store/modules/config';
import { loadStateFiles } from '@app/store/modules/emhttp';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { setApiKeyState } from '@app/store/modules/apikey';

describe('apiKeyCheckJob Tests', () => {
	it('API Check Job (with success)', async () => {
		await appStore.store.dispatch(loadConfigFile());
		await appStore.store.dispatch(loadStateFiles());
		appStore.store.dispatch(setApiKeyState(API_KEY_STATUS.PENDING_VALIDATION));
		const { dispatch, getState } = appStore.store;

		const validationSpy = vi.spyOn(apiKeyValidator, 'validateApiKeyWithKeyServer').mockResolvedValue(API_KEY_STATUS.API_KEY_VALID);

		await expect(apiKeyCheckJobs.apiKeyCheckJob(getState, dispatch)).resolves.toBe(true);

		expect(validationSpy).toHaveBeenCalledOnce();

		expect(appStore.store.getState().apiKey.status).toBe(API_KEY_STATUS.API_KEY_VALID);
	});

	it('API Check Job (with a failure that throws an error - NETWORK_ERROR)', async () => {
		await appStore.store.dispatch(loadConfigFile());
		await appStore.store.dispatch(loadStateFiles());
		appStore.store.dispatch(setApiKeyState(API_KEY_STATUS.PENDING_VALIDATION));
		const { dispatch, getState } = appStore.store;

		const validationSpy = vi.spyOn(apiKeyValidator, 'validateApiKeyWithKeyServer')
			.mockResolvedValueOnce(API_KEY_STATUS.NETWORK_ERROR);

		await expect(apiKeyCheckJobs.apiKeyCheckJob(getState, dispatch)).rejects.toThrowErrorMatchingInlineSnapshot('"Keyserver Failure, must retry"');

		expect(validationSpy).toHaveBeenCalledOnce();

		expect(appStore.store.getState().apiKey.status).toBe(API_KEY_STATUS.NETWORK_ERROR);
	});

	it('API Check Job (with a failure that throws an error - INVALID_RESPONSE)', async () => {
		await appStore.store.dispatch(loadConfigFile());
		await appStore.store.dispatch(loadStateFiles());
		appStore.store.dispatch(setApiKeyState(API_KEY_STATUS.PENDING_VALIDATION));
		const { dispatch, getState } = appStore.store;

		const validationSpy = vi.spyOn(apiKeyValidator, 'validateApiKeyWithKeyServer')
			.mockResolvedValueOnce(API_KEY_STATUS.INVALID_KEYSERVER_RESPONSE);

		await expect(apiKeyCheckJobs.apiKeyCheckJob(getState, dispatch)).rejects.toThrowErrorMatchingInlineSnapshot('"Keyserver Failure, must retry"');

		expect(validationSpy).toHaveBeenCalledOnce();

		expect(appStore.store.getState().apiKey.status).toBe(API_KEY_STATUS.INVALID_KEYSERVER_RESPONSE);
	}, 10_000);

	it('API Check Job (with failure that results in a log out)', async () => {
		await appStore.store.dispatch(loadConfigFile());
		await appStore.store.dispatch(loadStateFiles());
		appStore.store.dispatch(setApiKeyState(API_KEY_STATUS.PENDING_VALIDATION));
		const { getState } = appStore.store;

		const dispatch = vi.fn();

		const validationSpy = vi.spyOn(apiKeyValidator, 'validateApiKeyWithKeyServer')
			.mockResolvedValueOnce(API_KEY_STATUS.API_KEY_INVALID);

		await expect(apiKeyCheckJobs.apiKeyCheckJob(getState, dispatch)).resolves.toBe(false);

		expect(validationSpy).toHaveBeenCalledOnce();
		expect(dispatch).toHaveBeenCalledTimes(1);

		expect(appStore.store.getState().apiKey.status).toBe(API_KEY_STATUS.PENDING_VALIDATION);
	}, 10_000);
});
