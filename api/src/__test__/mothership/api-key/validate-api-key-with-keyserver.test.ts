import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as keyserverValidation from '@app/core/utils/misc/send-form-to-keyserver';
import * as appStore from '@app/store';
import { KEYSERVER_VALIDATION_ENDPOINT } from '@app/consts';
import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';

describe('tests without key cache', async () => {
	test('validates a valid key successfully', async () => {
		const { validateApiKeyWithKeyServer } = await import('@app/mothership/api-key/validate-api-key-with-keyserver');

		const mockedFormResponse = vi.fn().mockResolvedValue({ body: JSON.stringify({ valid: true }), statusCode: 200 });
		vi.spyOn(keyserverValidation, 'sendFormToKeyServer').mockImplementation(mockedFormResponse);
		vi.spyOn(appStore.store, 'dispatch');
		await expect(validateApiKeyWithKeyServer({ apiKey: 'this-api-key-is-valid-because-of-spy', flashGuid: 'my-flash-guid' })).resolves.toBe(API_KEY_STATUS.API_KEY_VALID);
		expect(vi.mocked(keyserverValidation.sendFormToKeyServer)).toHaveBeenCalledWith(KEYSERVER_VALIDATION_ENDPOINT, {
			guid: 'my-flash-guid',
			apikey: 'this-api-key-is-valid-because-of-spy',
		});
		expect(vi.mocked(appStore.store.dispatch)).not.toHaveBeenCalled();
	});

	test('fails to validate an invalid key', async () => {
		const { validateApiKeyWithKeyServer } = await import('@app/mothership/api-key/validate-api-key-with-keyserver');

		const mockedFormResponse = vi.fn().mockResolvedValue({ body: JSON.stringify({ valid: false }), statusCode: 200 });
		vi.spyOn(keyserverValidation, 'sendFormToKeyServer').mockImplementation(mockedFormResponse);

		await expect(validateApiKeyWithKeyServer({ apiKey: 'this-api-key-is-valid-because-of-spy', flashGuid: 'my-flash-guid' })).resolves.toBe(API_KEY_STATUS.API_KEY_INVALID);
		expect(vi.mocked(keyserverValidation.sendFormToKeyServer)).toHaveBeenCalledWith('https://keys.lime-technology.com/validate/apikey', {
			guid: 'my-flash-guid',
			apikey: 'this-api-key-is-valid-because-of-spy',
		});
	});

	test('when mocked api response throws an error, returns NETWORK_ERROR', async () => {
		const { validateApiKeyWithKeyServer } = await import('@app/mothership/api-key/validate-api-key-with-keyserver');

		const mockedErrorResponse = vi.fn().mockRejectedValue(new Error('Sending API Key to Server Failed'));
		vi.spyOn(keyserverValidation, 'sendFormToKeyServer').mockImplementation(mockedErrorResponse);

		await expect(validateApiKeyWithKeyServer({ apiKey: 'this-api-key-is-valid-because-of-spy', flashGuid: 'my-flash-guid' })).resolves.toBe(API_KEY_STATUS.NETWORK_ERROR);
	});

	test('when status code is not 200, returns INVALID_KEYSERVER_RESPONSE', async () => {
		const { validateApiKeyWithKeyServer } = await import('@app/mothership/api-key/validate-api-key-with-keyserver');
		const mockedFormResponse = vi.fn().mockResolvedValue({ body: JSON.stringify({ valid: false }), statusCode: 300 });
		vi.spyOn(keyserverValidation, 'sendFormToKeyServer').mockImplementation(mockedFormResponse);
		await expect(validateApiKeyWithKeyServer({ apiKey: 'this-api-key-is-valid-because-of-spy', flashGuid: 'my-flash-guid' })).resolves.toBe(API_KEY_STATUS.INVALID_KEYSERVER_RESPONSE);

		expect(vi.mocked(keyserverValidation.sendFormToKeyServer)).toHaveBeenCalledWith('https://keys.lime-technology.com/validate/apikey', {
			guid: 'my-flash-guid',
			apikey: 'this-api-key-is-valid-because-of-spy',
		});
	});

	test('when body is not parseable, returns INVALID_KEYSERVER_RESPONSE', async () => {
		const { validateApiKeyWithKeyServer } = await import('@app/mothership/api-key/validate-api-key-with-keyserver');
		const mockedFormResponse = vi.fn().mockResolvedValue({ body: '{ thisIsInvalidJson }', statusCode: 200 });
		vi.spyOn(keyserverValidation, 'sendFormToKeyServer').mockImplementation(mockedFormResponse);
		await expect(validateApiKeyWithKeyServer({ apiKey: 'this-api-key-is-valid-because-of-spy', flashGuid: 'my-flash-guid' })).resolves.toBe(API_KEY_STATUS.INVALID_KEYSERVER_RESPONSE);

		expect(vi.mocked(keyserverValidation.sendFormToKeyServer)).toHaveBeenCalledWith('https://keys.lime-technology.com/validate/apikey', {
			guid: 'my-flash-guid',
			apikey: 'this-api-key-is-valid-because-of-spy',
		});
	});

	test('when body returns wrong information, returns INVALID_KEYSERVER_RESPONSE', async () => {
		const { validateApiKeyWithKeyServer } = await import('@app/mothership/api-key/validate-api-key-with-keyserver');
		const mockedFormResponse = vi.fn().mockResolvedValue({ body: JSON.stringify({ wrongField: true }), statusCode: 200 });

		vi.spyOn(keyserverValidation, 'sendFormToKeyServer').mockImplementation(mockedFormResponse);
		await expect(validateApiKeyWithKeyServer({ apiKey: 'this-api-key-is-valid-because-of-spy', flashGuid: 'my-flash-guid' })).resolves.toBe(API_KEY_STATUS.INVALID_KEYSERVER_RESPONSE);
	});
});
